import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class RenameTransform(BaseTransform):
    key = "rename"
    name = "Rename Columns"
    description = "Rename one or more columns in the dataset."
    
    input_schema = {
        "type": "object",
        "properties": {
            "source_table": {
                "type": "string",
                "label": "Source Table"
            },
            "mappings": {
                "type": "array",
                "label": "Column Mappings",
                "items": {
                    "type": "object",
                    "properties": {
                        "old_name": {
                            "type": "string",
                            "label": "Current Column Name"
                        },
                        "new_name": {
                            "type": "string",
                            "label": "New Column Name"
                        }
                    },
                    "required": ["old_name", "new_name"]
                }
            }
        },
        "required": ["mappings"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("Rename requires at least one input table.")
        
        df = inputs[0].copy()
        mappings = params.get("mappings", [])
        
        if not mappings:
            return df
        
        # Build rename dictionary
        rename_dict = {}
        for mapping in mappings:
            old_name = mapping.get("old_name")
            new_name = mapping.get("new_name")
            
            if not old_name or not new_name:
                continue
            
            if old_name not in df.columns:
                raise ValueError(f"Column '{old_name}' not found in input data.")
            
            if new_name in df.columns and new_name != old_name:
                raise ValueError(f"Column '{new_name}' already exists. Choose a different name.")
            
            rename_dict[old_name] = new_name
        
        if rename_dict:
            df = df.rename(columns=rename_dict)
        
        return df
