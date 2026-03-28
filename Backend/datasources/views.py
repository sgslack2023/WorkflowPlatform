from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import DataSource, DynamicTable
from .serializers import DataSourceSerializer, DynamicTableSerializer
from .services import DynamicTableService
import pandas as pd
import io
import json
import base64
import re

class DataSourceViewSet(viewsets.ModelViewSet):
    queryset = DataSource.objects.all()
    serializer_class = DataSourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        return self.queryset.filter(
            Q(organization__isnull=True) | 
            Q(organization__memberships__user=self.request.user)
        ).distinct()
    
    def perform_create(self, serializer):
        # Auto-assign organization if user has one, otherwise create without organization
        membership = self.request.user.memberships.first()
        if membership:
            serializer.save(organization=membership.organization)
        else:
            # Allow creation without organization (for superusers or global resources)
            serializer.save()

class DynamicTableViewSet(viewsets.ModelViewSet):
    queryset = DynamicTable.objects.all()
    serializer_class = DynamicTableSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        from django.db.models import Q
        queryset = self.queryset.filter(
            Q(organization__isnull=True) | 
            Q(organization__memberships__user=self.request.user)
        ).distinct()
        
        datasource_id = self.request.query_params.get('datasource_id')
        if datasource_id:
            queryset = queryset.filter(data_source_id=datasource_id)

        datasource_id_in = self.request.query_params.get('datasource_id__in')
        if datasource_id_in:
            ids = datasource_id_in.split(',')
            queryset = queryset.filter(data_source_id__in=ids)

        id_in = self.request.query_params.get('id__in')
        if id_in:
            ids = id_in.split(',')
            queryset = queryset.filter(id__in=ids)
            
        return queryset

    def perform_create(self, serializer):
        # Auto-assign organization if user has one, otherwise create without organization
        membership = self.request.user.memberships.first()
        if membership:
            dt = serializer.save(organization=membership.organization)
        else:
            dt = serializer.save()
        
        service = DynamicTableService()
        try:
            service.create_table(dt)
        except Exception as e:
            # If creation fails, we might want to delete the model instance or handle error
            # For now, just logging or letting it bubble up might be enough, but raising API error is better
            dt.delete()
            raise ValueError(f"Failed to create physical table: {str(e)}")

    def perform_update(self, serializer):
        dt = serializer.save()
        service = DynamicTableService()
        try:
            print(f"[DynamicTable] Syncing schema for table '{dt.name}' (physical: {dt.physical_table_name})")
            print(f"[DynamicTable] Schema columns: {[c['name'] + ':' + c['type'] for c in dt.schema_definition.get('columns', [])]}")
            service.sync_schema(dt)
            print(f"[DynamicTable] Schema sync completed successfully")
        except Exception as e:
            print(f"[DynamicTable] Schema sync FAILED: {str(e)}")
            import traceback
            traceback.print_exc()
            raise ValueError(f"Failed to sync schema: {str(e)}")

    def perform_destroy(self, instance):
        service = DynamicTableService()
        service.delete_table(instance)
        instance.delete()

    @action(detail=True, methods=['post'], url_path='rows')
    def insert_rows(self, request, pk=None):
        dt = self.get_object()
        rows = request.data.get('rows', [])
        if not rows:
            return Response({"error": "No rows provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        service = DynamicTableService()
        try:
            service.insert_rows(dt, rows)
            return Response({"status": "success", "count": len(rows)})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        dt = self.get_object()
        history = dt.history.all().order_by('-created_at')
        from .serializers import DynamicTableHistorySerializer
        serializer = DynamicTableHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='rows')
    def fetch_rows(self, request, pk=None):
        dt = self.get_object()
        # Default to 10000 rows to support larger datasets; UI can pass smaller limit if needed
        limit = int(request.query_params.get('limit', 10000))
        
        service = DynamicTableService()
        try:
            data = service.fetch_rows(dt, limit=limit)
            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='validate-upload')
    def validate_upload(self, request, pk=None):
        dt = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            else:
                df = pd.read_excel(file_obj)
            
            # Sanitize column names to snake_case to match generated schema
            df.columns = [re.sub(r'[^a-z0-9]+', '_', str(c).lower()).strip('_') if pd.notnull(c) else f"unnamed_{i}" for i, c in enumerate(df.columns)]
            
            total_rows = len(df)
            columns = df.columns.tolist()
            
            # Check against schema if exists
            schema = dt.schema_definition
            errors = []
            invalid_count = 0
            error_report_csv = None
            
            if schema and 'columns' in schema:
                schema_columns_def = schema['columns']
                schema_cols = [c['name'] for c in schema_columns_def]
                
                # Check for missing columns (Critical)
                missing_cols = [c for c in schema_cols if c not in columns]
                if missing_cols:
                    errors.append(f"Header Mismatch: Missing columns {', '.join(missing_cols)}")
                
                # Prepare for referential integrity checks
                fk_constraints = []
                from django.db import connections
                dw_connection = connections['data_warehouse']
                for col_def in schema_columns_def:
                    if col_def.get('foreign_key') and col_def['name'] in columns:
                        try:
                            target_table = DynamicTable.objects.get(id=col_def['foreign_key']['target_table_id'])
                            if target_table.physical_table_name:
                                with dw_connection.cursor() as cursor:
                                    cursor.execute(f'SELECT id FROM "{target_table.physical_table_name}"')
                                    valid_ids = {row[0] for row in cursor.fetchall()}
                                    fk_constraints.append({
                                        'column': col_def['name'],
                                        'valid_ids': valid_ids,
                                        'table_name': target_table.name
                                    })
                        except DynamicTable.DoesNotExist:
                            pass

                # Row-by-row validation
                df_with_errors = df.copy()
                df_with_errors['__validation_errors'] = ""
                
                for index, row in df.iterrows():
                    row_errors = []
                    
                    # 1. Foreign Key Validation
                    for constraint in fk_constraints:
                        val = row.get(constraint['column'])
                        if pd.notnull(val) and val != '':
                            try:
                                if int(float(val)) not in constraint['valid_ids']:
                                    row_errors.append(f"Invalid {constraint['table_name']} ID: {val}")
                            except (ValueError, TypeError):
                                row_errors.append(f"Invalid ID format in {constraint['column']}")
                                
                    # 2. Schema Type Validation
                    for col_def in schema_columns_def:
                        col_name = col_def['name']
                        col_type = col_def['type']
                        if col_name in columns:
                            val = row.get(col_name)
                            if pd.notnull(val) and val != '':
                                if col_type == 'integer':
                                    try:
                                        if float(val) != int(float(val)):
                                            raise ValueError
                                    except (ValueError, TypeError):
                                        row_errors.append(f"Invalid integer in '{col_name}': {val}")
                                elif col_type == 'float':
                                    try:
                                        float(val)
                                    except (ValueError, TypeError):
                                        row_errors.append(f"Invalid number in '{col_name}': {val}")
                                elif col_type == 'boolean':
                                    if str(val).lower().strip() not in ['true', 'false', '1', '0', 'yes', 'no', 't', 'f']:
                                        row_errors.append(f"Invalid boolean in '{col_name}': {val}")
                                elif col_type in ['date', 'datetime']:
                                    try:
                                        pd.to_datetime(val)
                                    except Exception:
                                        row_errors.append(f"Invalid date format in '{col_name}': {val}")
                                elif col_type == 'json':
                                    if isinstance(val, str):
                                        try:
                                            json.loads(val)
                                        except json.JSONDecodeError:
                                            row_errors.append(f"Invalid JSON in '{col_name}': {val}")
                    
                    if row_errors:
                        error_text = "; ".join(row_errors)
                        df_with_errors.at[index, '__validation_errors'] = error_text
                        invalid_count += 1

                if invalid_count > 0:
                    # Generate CSV Report for invalid rows only
                    error_report_df = df_with_errors[df_with_errors['__validation_errors'] != ""]
                    csv_buffer = io.StringIO()
                    error_report_df.to_csv(csv_buffer, index=False)
                    error_report_csv = base64.b64encode(csv_buffer.getvalue().encode()).decode()
                    
                    errors.append(f"Found {invalid_count} rows with validation errors. Please download the report to fix them.")

            # Determine critical errors (header mismatches) vs row errors
            # If any header is missing, it's a critical error
            critical_errors = [e for e in errors if "Missing columns" in e]
            
            # Use pandas to_json to safely handle NaNs, dates, etc., converting to a Python list of dicts stringly typed
            preview_str = df.head(10).to_json(orient='records', date_format='iso')
            preview = json.loads(preview_str)
            
            return Response({
                "total_rows": total_rows,
                "columns": columns,
                "schema_match": len(critical_errors) == 0,
                "errors": errors,
                "error_report_csv": error_report_csv,
                "preview": preview,
                "stats": {
                    "total": total_rows,
                    "valid": total_rows - invalid_count,
                    "invalid": invalid_count
                }
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='upload')
    def upload_file(self, request, pk=None):
        dt = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            skip_errors = request.query_params.get('skip_errors', 'false').lower() == 'true'
            
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            else:
                df = pd.read_excel(file_obj)
            
            # Sanitize column names
            df.columns = [re.sub(r'[^a-z0-9]+', '_', str(c).lower()).strip('_') if pd.notnull(c) else f"unnamed_{i}" for i, c in enumerate(df.columns)]
            
            # Clean and validate data based on schema
            schema_columns_def = dt.schema_definition.get('columns', [])
            valid_mask = pd.Series([True] * len(df))
            
            # Type checking and cleaning for ALL uploads (not just skip_errors)
            for col_def in schema_columns_def:
                col_name = col_def['name']
                col_type = col_def['type']
                if col_name in df.columns:
                    if col_type == 'integer':
                        def is_int(x):
                            try:
                                if pd.isnull(x) or x == '': return True
                                return float(x) == int(float(x))
                            except: return False
                        if skip_errors:
                            valid_mask &= df[col_name].apply(is_int)
                        else:
                            # Convert to int, set invalid to None
                            df[col_name] = pd.to_numeric(df[col_name], errors='coerce').astype('Int64')
                    elif col_type == 'float':
                        def is_float(x):
                            try:
                                if pd.isnull(x) or x == '': return True
                                float(x); return True
                            except: return False
                        if skip_errors:
                            valid_mask &= df[col_name].apply(is_float)
                        else:
                            # Convert to float, set invalid to None
                            df[col_name] = pd.to_numeric(df[col_name], errors='coerce')
                    elif col_type in ['date', 'datetime']:
                        # Clean datetime columns - convert invalid dates to None
                        def is_valid_date(x):
                            try:
                                if pd.isnull(x) or x == '': return True
                                pd.to_datetime(x)
                                return True
                            except: return False
                        
                        if skip_errors:
                            valid_mask &= df[col_name].apply(is_valid_date)
                        else:
                            # Convert to datetime, set invalid to None
                            df[col_name] = pd.to_datetime(df[col_name], errors='coerce')
            
            if skip_errors:
                df = df[valid_mask]

            # Convert to serializable format
            rows_str = df.to_json(orient='records', date_format='iso')
            rows = json.loads(rows_str)
            
            service = DynamicTableService()
            service.insert_rows(dt, rows)
            
            return Response({"status": "success", "count": len(rows)})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=True, methods=['post'], url_path='clear-rows')
    def clear_rows(self, request, pk=None):
        dt = self.get_object()
        service = DynamicTableService()
        try:
            service.clear_rows(dt)
            return Response({"status": "success"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='recreate-table')
    def recreate_table(self, request, pk=None):
        """Drop and recreate the physical table with current schema definition.
        Use this when the physical table schema is out of sync with the definition."""
        dt = self.get_object()
        service = DynamicTableService()
        try:
            # Drop the old table if it exists
            if dt.physical_table_name:
                service.drop_table(dt)
            
            # Create fresh table with current schema
            service.create_table(dt)
            
            return Response({
                "status": "success", 
                "message": f"Table recreated with schema: {[c['name'] + ' (' + c['type'] + ')' for c in dt.schema_definition.get('columns', [])]}"
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
