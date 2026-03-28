import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class JoinTransform(BaseTransform):
    key = "join"
    name = "Join Tables"
    description = "Merge two tables together using one or more common columns, or a Cartesian product (Cross Join)."
    
    input_schema = {
        "type": "object",
        "properties": {
            "how": {
                "type": "string",
                "enum": ["inner", "left", "right", "outer", "cross"],
                "default": "inner",
                "label": "Join Type"
            },
            "left_on": {
                "type": "array",
                "items": {"type": "string"},
                "label": "Left Table Columns"
            },
            "right_on": {
                "type": "array",
                "items": {"type": "string"},
                "label": "Right Table Columns"
            }
        },
        "required": ["how"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if len(inputs) < 2:
            raise ValueError("Join requires exactly two input tables.")
        
        df_left = inputs[0]
        df_right = inputs[1]
        how = params.get("how", "inner").lower()
        
        if how == "cross":
            query = "SELECT * FROM df_left, df_right"
            return self.run_query(query, {"df_left": df_left, "df_right": df_right})
        
        left_on = params.get("left_on", [])
        right_on = params.get("right_on", [])
        
        # Support legacy single-column format
        if isinstance(left_on, str):
            left_on = [left_on]
        if isinstance(right_on, str):
            right_on = [right_on]
        
        if not left_on or not right_on:
            raise ValueError(f"{how} Join requires 'left_on' and 'right_on' parameters.")
        
        if len(left_on) != len(right_on):
            raise ValueError(f"left_on ({len(left_on)} columns) and right_on ({len(right_on)} columns) must have the same number of columns.")
        
        # Use pandas merge for reliability with multi-column joins
        join_type_map = {
            "inner": "inner",
            "left": "left", 
            "right": "right",
            "outer": "outer"
        }
        
        pandas_how = join_type_map.get(how, "inner")
        
        # Create copies to avoid modifying original dataframes
        df_left_clean = df_left.copy()
        df_right_clean = df_right.copy()
        
        # Trim whitespace from join columns (common data quality issue)
        for col in left_on:
            if col in df_left_clean.columns and df_left_clean[col].dtype == 'object':
                df_left_clean[col] = df_left_clean[col].astype(str).str.strip()
        for col in right_on:
            if col in df_right_clean.columns and df_right_clean[col].dtype == 'object':
                df_right_clean[col] = df_right_clean[col].astype(str).str.strip()
        
        result = pd.merge(
            df_left_clean, 
            df_right_clean, 
            left_on=left_on, 
            right_on=right_on, 
            how=pandas_how,
            suffixes=('', '_right')
        )
        
        # Drop the duplicate join columns from the right side
        cols_to_drop = [col for col in result.columns if col.endswith('_right') and col[:-6] in left_on]
        # Also drop the original right_on columns if they differ from left_on
        for r_col in right_on:
            if r_col in result.columns and r_col not in left_on:
                cols_to_drop.append(r_col)
        
        if cols_to_drop:
            result = result.drop(columns=cols_to_drop, errors='ignore')
        
        # For outer/left joins, sort so that matched rows (non-null left keys) appear first
        if pandas_how in ['left', 'outer'] and left_on[0] in result.columns:
            result = result.sort_values(by=left_on[0], na_position='last')
        
        return result
