import pandas as pd
from django.db import connections
from datasources.models import DynamicTable
from datasources.services import DynamicTableService
from .models import TransformDefinition, TransformRun
import importlib
from django.utils import timezone

class TransformService:
    def execute_transform(self, transform_run: TransformRun):
        """
        Main entry point for running a transformation.
        """
        transform_def = transform_run.transform
        transform_run.status = "running"
        transform_run.started_at = timezone.now()
        transform_run.save()

        try:
            # 1. Load the Transform Class
            module_name, class_name = transform_def.python_path.rsplit('.', 1)
            module = importlib.import_module(module_name)
            transform_class = getattr(module, class_name)
            transform_instance = transform_class()

            # 2. Fetch input DataFrames from the Data Warehouse
            dt_service = DynamicTableService()
            input_dfs = []
            for dt in transform_def.input_tables.all():
                rows = dt_service.fetch_rows(dt, limit=1000000) # Fetch all for transformation
                input_dfs.append(pd.DataFrame(rows))

            # 3. Execute
            params = transform_def.dsl_definition.get('parameters', {})
            result_df = transform_instance.execute(input_dfs, params)

            # 4. Save Result as a new DynamicTable in the Warehouse
            output_dt_name = f"Result of {transform_def.name}"
            output_dt = DynamicTable.objects.create(
                organization=transform_def.organization,
                name=output_dt_name,
                schema_definition=self._infer_schema(result_df)
            )
            
            # Use service to create physical table in warehouse
            dt_service.create_table(output_dt)
            
            # Insert result data
            rows_to_insert = result_df.to_dict(orient='records')
            dt_service.insert_rows(output_dt, rows_to_insert)

            # 5. Finalize Run
            transform_run.output_table = output_dt
            transform_run.status = "success"
        except Exception as e:
            transform_run.status = "failed"
            transform_run.error = str(e)
        finally:
            transform_run.finished_at = timezone.now()
            transform_run.save()

    def _infer_schema(self, df: pd.DataFrame):
        """Simple schema inference from DataFrame"""
        columns = []
        for col_name, dtype in df.dtypes.items():
            col_type = 'string'
            if 'int' in str(dtype): col_type = 'integer'
            elif 'float' in str(dtype): col_type = 'number'
            elif 'bool' in str(dtype): col_type = 'boolean'
            elif 'datetime' in str(dtype): col_type = 'datetime'
            
            columns.append({
                "name": str(col_name),
                "type": col_type
            })
        return {"columns": columns}
