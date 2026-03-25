from typing import Dict, Any, Optional
from tools.library.base import BaseTool
from collections import defaultdict

class PivotTable(BaseTool):
    name = "Pivot Table"
    key = "data.pivot"
    description = "Pivots a dataset (List of Dicts) based on row/column keys."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "data": {"type": "array", "items": {"type": "object"}},
            "index_col": {"type": "string", "description": "Column to use as rows"},
            "columns_col": {"type": "string", "description": "Column to use as new columns"},
            "values_col": {"type": "string", "description": "Column to aggregate"},
            "agg_func": {"type": "string", "enum": ["sum", "count", "avg"], "default": "sum"}
        },
        "required": ["data", "index_col", "columns_col", "values_col"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "pivoted_data": {"type": "array", "items": {"type": "object"}}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = inputs['data']
        index = inputs['index_col']
        params_col = inputs['columns_col'] # 'columns' is reserved in python
        values = inputs['values_col']
        agg = inputs.get('agg_func', 'sum')
        
        # Grouping
        grouped = defaultdict(list)
        all_cols = set()
        
        for row in data:
            r_key = row.get(index)
            c_key = row.get(params_col)
            val = row.get(values, 0)
            
            if r_key is not None and c_key is not None:
                grouped[r_key].append((c_key, val))
                all_cols.add(c_key)
                
        # Aggregation
        results = []
        sorted_cols = sorted(list(all_cols))
        
        for r_key, items in grouped.items():
            row_res = {index: r_key}
            
            col_buckets = defaultdict(list)
            for c, v in items:
                col_buckets[c].append(v)
                
            for c in sorted_cols:
                vals = col_buckets.get(c, [])
                if not vals:
                    res = 0
                elif agg == 'sum':
                    res = sum(vals)
                elif agg == 'count':
                    res = len(vals)
                elif agg == 'avg':
                    res = sum(vals) / len(vals) if vals else 0
                else:
                    res = 0
                row_res[c] = res
                
            results.append(row_res)
            
        return {"pivoted_data": results}
