import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class SortTransform(BaseTransform):
    key = "sort"
    name = "Sort Data"
    description = "Reorder rows based on one or more columns in ascending or descending order."
    
    input_schema = {
        "type": "object",
        "properties": {
            "sort_columns": {
                "type": "array",
                "label": "Sort By",
                "items": {
                    "type": "object",
                    "properties": {
                        "column": {"type": "string", "label": "Column"},
                        "order": {
                            "type": "string",
                            "enum": ["ASC", "DESC"],
                            "default": "ASC",
                            "label": "Order"
                        }
                    },
                    "required": ["column", "order"]
                }
            }
        },
        "required": ["sort_columns"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("Sort requires at least one input table.")
        
        df = inputs[0]
        sort_columns = params.get("sort_columns", [])
        
        if not sort_columns:
            return df
            
        order_parts = []
        for sort in sort_columns:
            col = sort["column"]
            order = sort["order"]
            order_parts.append(f"{col} {order}")
            
        order_by_clause = f"ORDER BY {', '.join(order_parts)}"
        query = f"SELECT * FROM df {order_by_clause}"
        
        return self.run_query(query, {"df": df})
