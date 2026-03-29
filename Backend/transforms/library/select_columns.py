import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class SelectColumnsTransform(BaseTransform):
    key = "select_columns"
    name = "Select Columns"
    description = "Keep only the selected columns from the table."
    
    input_schema = {
        "type": "object",
        "properties": {
            "columns": {
                "type": "array",
                "items": {"type": "string"},
                "label": "Columns to Keep"
            }
        },
        "required": ["columns"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("No input data provided.")
        
        df = inputs[0]
        columns_to_keep = params.get("columns", [])
        
        if not columns_to_keep:
            return df
        
        # Filter to only existing columns
        existing_cols = [c for c in columns_to_keep if c in df.columns]
        
        if not existing_cols:
            return df
        
        # Select only the specified columns
        select_list = ", ".join(f'"{c}"' for c in existing_cols)
        query = f"SELECT {select_list} FROM df"
        
        return self.run_query(query, {"df": df})
