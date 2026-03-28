from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
import importlib
import pandas as pd
from django.db import models
from datasources.services import DynamicTableService
from datasources.models import DynamicTable
from .models import TransformDefinition, TransformRun
from .serializers import TransformDefinitionSerializer, TransformRunSerializer

class TransformDefinitionViewSet(viewsets.ModelViewSet):
    queryset = TransformDefinition.objects.all()
    serializer_class = TransformDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return self.queryset.filter(
            Q(organization__isnull=True) | 
            Q(organization__memberships__user=self.request.user)
        )

    def _resolve_input_data(self, tid, dt_service):
        """Recursively resolve data for a given ID (Table ID or Node ID)."""
        # 1. Try raw table
        try:
            dt = DynamicTable.objects.get(id=tid)
            rows = dt_service.fetch_rows(dt, limit=10000)
            df = pd.DataFrame(rows)
            if df.empty and dt.schema_definition and 'columns' in dt.schema_definition:
                cols = [c['name'] for c in dt.schema_definition['columns']]
                df = pd.DataFrame(columns=cols)
            return df
        except DynamicTable.DoesNotExist:
            pass

        # 2. Try workflow node (supporting virtual schemas)
        from workflows.models import WorkflowNode
        node = WorkflowNode.objects.filter(
            models.Q(id=tid) | 
            models.Q(langgraph_id=tid) |
            models.Q(config__frontend_id=tid)
        ).first()

        if node:
            if node.node_type == 'transform':
                algo_params = node.config.get('algo_parameters', {})
                
                # Identify all parent sources (handling single table, multi-table, and joins)
                parent_ids = []
                if algo_params.get('source_table'):
                    parent_ids.append(algo_params.get('source_table'))
                if algo_params.get('input_tables'):
                    parent_ids.extend(algo_params.get('input_tables'))
                if algo_params.get('left_table'):
                    parent_ids.append(algo_params.get('left_table'))
                if algo_params.get('right_table'):
                    parent_ids.append(algo_params.get('right_table'))
                
                if parent_ids:
                    # Recursively resolve all parent datasets
                    parent_dfs = [self._resolve_input_data(pid, dt_service) for pid in parent_ids]
                    # Filter out truly empty markers if necessary, but keep original indices
                    
                    # Run this node's transform definition
                    from .models import TransformDefinition
                    t_def = None
                    res_id = node.config.get('resource_id')
                    if res_id:
                        t_def = TransformDefinition.objects.filter(id=res_id).first()
                    
                    if not t_def:
                        t_key = node.config.get('transformKey') or node.config.get('key')
                        if t_key:
                            t_def = TransformDefinition.objects.filter(key=t_key).first()
                    
                    if t_def:
                        try:
                            module_name, class_name = t_def.python_path.rsplit('.', 1)
                            module = importlib.import_module(module_name)
                            t_class = getattr(module, class_name)
                            t_instance = t_class()
                            
                            # Inject input table IDs for nodes like Smart Cube that map data by index
                            exec_params = algo_params.copy()
                            exec_params['_input_table_ids'] = parent_ids
                            
                            print(f"  [Preview] Executing upstream transform '{t_def.name}' ({node.id}) with {len(parent_dfs)} inputs")
                            return t_instance.execute(parent_dfs, exec_params)
                        except Exception as e:
                            print(f"Error running upstream transform for node {node.id}: {e}")
                            return parent_dfs[0] if parent_dfs else pd.DataFrame()
                    return parent_dfs[0] if parent_dfs else pd.DataFrame()
            elif node.node_type == 'datasource':
                # Map to the resource ID
                res_id = node.config.get('resourceId')
                if res_id: return self._resolve_input_data(res_id, dt_service)
        
        return pd.DataFrame()

    @action(detail=True, methods=['post'], url_path='run-preview')
    def run_preview(self, request, pk=None):
        transform_def = self.get_object()
        params = request.data.get('parameters', {})
        input_table_ids = request.data.get('input_table_ids', [])

        try:
            # 1. Load the Transform Class
            module_name, class_name = transform_def.python_path.rsplit('.', 1)
            module = importlib.import_module(module_name)
            transform_class = getattr(module, class_name)
            transform_instance = transform_class()

            # 2. Fetch input DataFrames using recursive resolver
            dt_service = DynamicTableService()
            input_dfs = []
            for tid in input_table_ids:
                df = self._resolve_input_data(tid, dt_service)
                # CRITICAL: We must append even if the DF is empty (0 rows) 
                # to maintain the correct index mapping for inputs.
                input_dfs.append(df)

            if not input_dfs and input_table_ids:
                 return Response({"error": "None of the input tables were found or accessible."}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Execute
            try:
                # Provide context to the transform if it needs to look up DB metadata
                execution_params = params.copy()
                execution_params['_input_table_ids'] = input_table_ids
                result_df = transform_instance.execute(input_dfs, execution_params)
            except Exception as transform_err:
                return Response({
                    "error": f"Transformation Logic Error: {str(transform_err)}",
                    "details": "Check if your parameters and selected columns match the input data."
                }, status=status.HTTP_400_BAD_REQUEST)

            # 4. Return Top 100 rows
            # Replace NaN/Inf values with None for JSON compatibility
            import numpy as np
            import math
            
            result_df = result_df.head(100)
            
            # Convert to records and clean non-JSON-serializable values
            data = result_df.to_dict(orient='records')
            for row in data:
                for key, value in row.items():
                    if value is None:
                        continue
                    if isinstance(value, float):
                        if math.isnan(value) or math.isinf(value):
                            row[key] = None
                    elif pd.isna(value):
                        row[key] = None
            
            # Infer columns for the frontend table
            columns = []
            for col_name, dtype in result_df.dtypes.items():
                columns.append({
                    "name": str(col_name),
                    "type": str(dtype)
                })

            return Response({
                "columns": columns,
                "rows": data
            })

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"System Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TransformRunViewSet(viewsets.ModelViewSet):
    queryset = TransformRun.objects.all()
    serializer_class = TransformRunSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(transform__organization__memberships__user=self.request.user)
