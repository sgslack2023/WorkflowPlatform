import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class TrimTransform(BaseTransform):
    key = "trim"
    name = "Trim Whitespace"
    description = "Remove leading and trailing whitespace from text columns."
    
    input_schema = {
        "type": "object",
        "properties": {
            "source_table": {
                "type": "string",
                "label": "Source Table"
            },
            "columns": {
                "type": "array",
                "label": "Columns to Trim",
                "items": {"type": "string"},
                "description": "Select columns to trim. Leave empty to trim all text columns."
            },
            "trim_type": {
                "type": "string",
                "enum": ["both", "leading", "trailing"],
                "default": "both",
                "label": "Trim Type",
                "description": "Remove whitespace from both sides, leading only, or trailing only"
            }
        }
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("Trim requires at least one input table.")
        
        df = inputs[0].copy()
        columns = params.get("columns", [])
        trim_type = params.get("trim_type", "both")
        
        # If no columns specified, trim all object (string) columns
        if not columns:
            columns = df.select_dtypes(include=['object']).columns.tolist()
        
        # Validate columns exist
        for col in columns:
            if col not in df.columns:
                raise ValueError(f"Column '{col}' not found in input data.")
        
        # Apply trimming based on type
        for col in columns:
            # Only trim if column contains string data
            if df[col].dtype == 'object' or pd.api.types.is_string_dtype(df[col]):
                if trim_type == "both":
                    df[col] = df[col].astype(str).str.strip()
                elif trim_type == "leading":
                    df[col] = df[col].astype(str).str.lstrip()
                elif trim_type == "trailing":
                    df[col] = df[col].astype(str).str.rstrip()
        
        return df
