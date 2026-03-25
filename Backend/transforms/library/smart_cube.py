import duckdb
import pandas as pd
from typing import Dict, Any, List
from django.db import models
from .base import BaseTransform
from datasources.models import DynamicTable

class SmartCubeTransform(BaseTransform):
    key = "agg.smart_cube"
    name = "Smart Data Cube"
    description = "Automatically join tables using relationships and create a multidimensional aggregate (CUBE)."
    
    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        input_ids = params.get('input_tables') or params.get('_input_table_ids') or []
        dimensions = params.get('dimensions', [])  # e.g., ["Inventory.product_family", "Sales.month"]
        measures = params.get('measures', [])     # e.g., [{"column": "Sales.amount", "agg": "sum"}]
        
        if not inputs:
            return pd.DataFrame()

        # 1. Map Table Names to DataFrames & Schemas
        tables_meta = []
        for idx, tid in enumerate(input_ids):
            if idx >= len(inputs): break
            try:
                dt = DynamicTable.objects.get(id=tid)
                tables_meta.append({
                    'id': str(tid),
                    'name': dt.name,
                    'schema': dt.schema_definition,
                    'df': inputs[idx],
                    'alias': dt.name.replace(" ", "_").lower()
                })
            except Exception:
                # If we can't find the table meta (e.g. it's a node ID), try to find the node label
                node_label = "Table"
                try:
                    from workflows.models import WorkflowNode
                    node = WorkflowNode.objects.filter(models.Q(id=tid) | models.Q(langgraph_id=tid)).first()
                    if node:
                        node_label = node.config.get('label') or node.node_type
                except:
                    pass

                tables_meta.append({
                    'id': str(tid),
                    'name': node_label,
                    'schema': {},
                    'df': inputs[idx],
                    'alias': f"t_{idx}"
                })
                continue

        if not tables_meta:
            return pd.DataFrame()

        con = duckdb.connect(database=':memory:')
        for meta in tables_meta:
            print(f"    [SmartCube] Registering '{meta['alias']}' (label: {meta['name']}) with columns: {list(meta['df'].columns)}")
            con.register(meta['alias'], meta['df'])

        # 2. Build Automatic Join Graph
        base = tables_meta[0]
        joined_aliases = {base['alias']}
        joined_ids = {base['id']}
        join_sql = f"FROM \"{base['alias']}\""
        
        # Simple greedy approach to find join paths via FKs
        to_join = tables_meta[1:]
        
        max_iters = len(to_join) * 2
        iters = 0
        while to_join and iters < max_iters:
            iters += 1
            changed = False
            for i, target in enumerate(to_join):
                found_fk = False
                
                # Check if base tables have FK to target
                for joined_meta in tables_meta:
                    if joined_meta['id'] not in joined_ids: continue
                    
                    cols = joined_meta['schema'].get('columns', [])
                    for col in cols:
                        fk = col.get('foreign_key')
                        if fk and str(fk.get('target_table_id')) == target['id']:
                            target_col = fk.get('target_column', 'id')
                            join_sql += f" LEFT JOIN \"{target['alias']}\" ON \"{joined_meta['alias']}\".\"{col['name']}\" = \"{target['alias']}\".\"{target_col}\""
                            joined_aliases.add(target['alias'])
                            joined_ids.add(target['id'])
                            to_join.pop(i)
                            found_fk = True
                            changed = True
                            break
                    if found_fk: break
                
                if found_fk: continue

                # Check if target has FK to base tables
                cols = target['schema'].get('columns', [])
                for col in cols:
                    fk = col.get('foreign_key')
                    if fk:
                        target_id = str(fk.get('target_table_id'))
                        for joined_meta in tables_meta:
                            if joined_meta['id'] in joined_ids and target_id == joined_meta['id']:
                                target_col = fk.get('target_column', 'id')
                                join_sql += f" LEFT JOIN \"{target['alias']}\" ON \"{target['alias']}\".\"{col['name']}\" = \"{joined_meta['alias']}\".\"{target_col}\""
                                joined_aliases.add(target['alias'])
                                joined_ids.add(target['id'])
                                to_join.pop(i)
                                found_fk = True
                                changed = True
                                break
                    if found_fk: break
                
                if changed: break
            if not changed: break

        # 3. Construct SELECT and GROUP BY
        def resolve_col(c):
            if "." in c:
                tbl, col = c.split(".", 1)
                
                # Try to find which alias this tbl name maps to
                # Suffixes added by frontend like " (Calculated Column)" might be present in c
                target_alias = None
                for meta in tables_meta:
                    if meta['name'] == tbl or tbl in meta['name']:
                        target_alias = meta['alias']
                        break
                
                if target_alias:
                    return f'"{target_alias}"."{col}"'
                    
                # Fallback to the first table if there's only one
                if len(joined_aliases) == 1:
                    return f'"{list(joined_aliases)[0]}"."{col}"'
                
                return f'"{tbl.replace(" ", "_").lower()}"."{col}"'
            return f'"{c}"'

        if not dimensions:
            # Fallback if no dims provided, just select everything from 1st table?
            # Or better, error out.
             return pd.DataFrame({"Error": ["No dimensions selected for Cube"]})

        resolved_dims = [resolve_col(d) for d in dimensions]
        
        agg_parts = []
        for m in measures:
            col_name = m['column']
            col = resolve_col(col_name)
            agg = m.get('agg', 'sum').upper()
            alias = f"{agg}_{col_name.replace('.', '_')}"
            
            # Numeric aggregations need numeric types. 
            # We use TRY_CAST to DOUBLE to handle potential non-numeric data gracefully.
            if agg in ('SUM', 'AVG', 'STDEV', 'VARIANCE', 'MEDIAN'):
                agg_parts.append(f"{agg}(TRY_CAST({col} AS DOUBLE)) AS \"{alias}\"")
            else:
                agg_parts.append(f"{agg}({col}) AS \"{alias}\"")
        
        if not agg_parts:
             agg_parts = ["COUNT(*) AS count"]
             
        select_clause = ", ".join(resolved_dims + agg_parts)
        group_clause = ", ".join(resolved_dims)
        
        final_sql = f"SELECT {select_clause} {join_sql} GROUP BY CUBE({group_clause})"
        print(f"    [SmartCube] Final SQL: {final_sql}")
        
        try:
            return con.execute(final_sql).df()
        except Exception as e:
            return pd.DataFrame({"Error": [str(e)], "SQL": [final_sql]})
