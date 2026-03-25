import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class DistinctTransform(BaseTransform):
    key = "distinct"
    name = "Unique Rows"
    description = "Remove duplicate rows from a table based on selected columns."
    
    input_schema = {
        "type": "object",
        "properties": {
            "columns": {
                "type": "array",
                "items": {"type": "string"},
                "label": "Columns to check for uniqueness",
                "description": "If empty, checks all columns."
            }
        }
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("Distinct requires at least one input table.")
        
        df = inputs[0]
        columns = params.get("columns", [])
        
        if columns:
            col_str = ", ".join(columns)
            query = f"SELECT DISTINCT {col_str} FROM df"
        else:
            query = "SELECT DISTINCT * FROM df"
            
        return self.run_query(query, {"df": df})
