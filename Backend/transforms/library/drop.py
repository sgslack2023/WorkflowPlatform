import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class DropColumnsTransform(BaseTransform):
    key = "drop"
    name = "Drop Columns"
    description = "Remove selected columns from the table."
    
    input_schema = {
        "type": "object",
        "properties": {
            "columns": {
                "type": "array",
                "items": {"type": "string"},
                "label": "Columns to Drop"
            }
        },
        "required": ["columns"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("No input data provided.")
        
        df = inputs[0]
        columns_to_drop = params.get("columns", [])
        
        if not columns_to_drop:
            return df
        
        # Filter to only existing columns
        existing_cols = [c for c in columns_to_drop if c in df.columns]
        
        if not existing_cols:
            return df
        
        # Build EXCLUDE clause
        exclude_list = ", ".join(existing_cols)
        query = f"SELECT * EXCLUDE ({exclude_list}) FROM df"
        
        return self.run_query(query, {"df": df})
