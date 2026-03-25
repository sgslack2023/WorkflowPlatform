import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class FilterTransform(BaseTransform):
    key = "filter"
    name = "Filter Data"
    description = "Filter rows based on specific conditions (e.g., column value greater than 500)."
    
    input_schema = {
        "type": "object",
        "properties": {
            "conditions": {
                "type": "array",
                "label": "Filters",
                "items": {
                    "type": "object",
                    "properties": {
                        "column": {"type": "string", "label": "Column"},
                        "operator": {
                            "type": "string",
                            "enum": ["=", ">", "<", ">=", "<=", "!=", "LIKE"],
                            "label": "Operator"
                        },
                        "value": {"type": "string", "label": "Value"}
                    },
                    "required": ["column", "operator", "value"]
                }
            },
            "logic": {
                "type": "string",
                "enum": ["AND", "OR"],
                "default": "AND",
                "label": "Logic"
            }
        },
        "required": ["conditions"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("Filter requires at least one input table.")
        
        df = inputs[0]
        conditions = params.get("conditions", [])
        logic = params.get("logic", "AND")
        
        if not conditions:
            return df
            
        where_parts = []
        for cond in conditions:
            col = cond["column"]
            op = cond["operator"]
            val = cond["value"]
            # Cast column to VARCHAR to allow safe comparison with string values from UI
            # This prevents "Conversion Error" when filtering numeric columns (like Month/Year) for blanks
            where_parts.append(f"CAST(\"{col}\" AS VARCHAR) {op} '{val}'")
            
        logic_sep = f" {logic} "
        where_clause = f" WHERE {logic_sep.join(where_parts)}" if where_parts else ""
        query = f"SELECT * FROM df {where_clause}"
        
        return self.run_query(query, {"df": df})
