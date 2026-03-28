import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class MeltTransform(BaseTransform):
    key = "melt"
    name = "Melt (Unpivot)"
    description = "Transform wide format data to long format by unpivoting columns into rows."
    
    input_schema = {
        "type": "object",
        "properties": {
            "source_table": {
                "type": "string",
                "label": "Source Table"
            },
            "id_vars": {
                "type": "array",
                "label": "ID Columns (keep as-is)",
                "items": {"type": "string"},
                "description": "Columns to keep as identifiers (not melted)"
            },
            "value_vars": {
                "type": "array",
                "label": "Value Columns (to unpivot)",
                "items": {"type": "string"},
                "description": "Columns to unpivot. Leave empty to melt all non-ID columns."
            },
            "var_name": {
                "type": "string",
                "label": "Variable Column Name",
                "default": "variable",
                "description": "Name for the new column containing the melted column names"
            },
            "value_name": {
                "type": "string",
                "label": "Value Column Name",
                "default": "value",
                "description": "Name for the new column containing the melted values"
            }
        },
        "required": ["id_vars"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("Melt requires at least one input table.")
        
        df = inputs[0]
        id_vars = params.get("id_vars", [])
        value_vars = params.get("value_vars", [])
        var_name = params.get("var_name", "variable")
        value_name = params.get("value_name", "value")
        
        if not id_vars:
            raise ValueError("At least one ID column is required for melt operation.")
        
        # Exclude 'id' column (auto-generated primary key) from operations
        system_cols = ['id', 'ID', 'Id']
        
        # If value_vars is empty, melt all columns except id_vars and system columns
        if not value_vars:
            value_vars = [col for col in df.columns if col not in id_vars and col not in system_cols]
        else:
            # Remove any system columns from value_vars if accidentally included
            value_vars = [col for col in value_vars if col not in system_cols]
        
        # Use pandas melt function
        result_df = pd.melt(
            df,
            id_vars=id_vars,
            value_vars=value_vars,
            var_name=var_name,
            value_name=value_name
        )
        
        return result_df
