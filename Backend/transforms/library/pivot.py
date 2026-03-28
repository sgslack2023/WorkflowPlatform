import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class PivotTransform(BaseTransform):
    key = "pivot"
    name = "Pivot (Wide Format)"
    description = "Transform long format data to wide format by pivoting a column into multiple columns."
    
    input_schema = {
        "type": "object",
        "properties": {
            "source_table": {
                "type": "string",
                "label": "Source Table"
            },
            "index": {
                "type": "array",
                "label": "Index Columns",
                "items": {"type": "string"},
                "description": "Columns to use as row identifiers (will not be pivoted)"
            },
            "columns": {
                "type": "string",
                "label": "Pivot Column",
                "description": "Column whose unique values will become new column headers"
            },
            "values": {
                "type": "string",
                "label": "Values Column",
                "description": "Column containing the values to populate the pivoted table"
            },
            "aggfunc": {
                "type": "string",
                "enum": ["sum", "mean", "count", "min", "max", "first", "last"],
                "default": "sum",
                "label": "Aggregation Function",
                "description": "How to aggregate if there are duplicate index/column combinations"
            }
        },
        "required": ["columns", "values"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("Pivot requires at least one input table.")
        
        df = inputs[0]
        index = params.get("index", [])
        columns = params.get("columns")
        values = params.get("values")
        aggfunc = params.get("aggfunc", "sum")
        
        if not columns:
            raise ValueError("Pivot column is required.")
        
        if not values:
            raise ValueError("Values column is required.")
        
        if columns not in df.columns:
            raise ValueError(f"Pivot column '{columns}' not found in input data.")
        
        if values not in df.columns:
            raise ValueError(f"Values column '{values}' not found in input data.")
        
        # Validate index columns
        for idx_col in index:
            if idx_col not in df.columns:
                raise ValueError(f"Index column '{idx_col}' not found in input data.")
        
        try:
            # Use pandas pivot_table for flexibility with aggregation
            if index:
                result_df = pd.pivot_table(
                    df,
                    index=index,
                    columns=columns,
                    values=values,
                    aggfunc=aggfunc,
                    fill_value=0
                )
            else:
                # If no index specified, use all columns except pivot and values
                index_cols = [col for col in df.columns if col not in [columns, values]]
                if not index_cols:
                    raise ValueError("No index columns available. Specify index columns explicitly.")
                
                result_df = pd.pivot_table(
                    df,
                    index=index_cols,
                    columns=columns,
                    values=values,
                    aggfunc=aggfunc,
                    fill_value=0
                )
            
            # Reset index to convert multi-index to regular columns
            result_df = result_df.reset_index()
            
            # Flatten column names if they're multi-level
            if isinstance(result_df.columns, pd.MultiIndex):
                result_df.columns = ['_'.join(map(str, col)).strip('_') for col in result_df.columns.values]
            else:
                result_df.columns = [str(col) for col in result_df.columns]
            
            return result_df
            
        except Exception as e:
            raise ValueError(f"Pivot operation failed: {str(e)}")
