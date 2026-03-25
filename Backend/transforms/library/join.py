import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class JoinTransform(BaseTransform):
    key = "join"
    name = "Join Tables"
    description = "Merge two tables together using a common column or a Cartesian product (Cross Join)."
    
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
                "type": "string",
                "label": "Left Table Column"
            },
            "right_on": {
                "type": "string",
                "label": "Right Table Column"
            }
        },
        "required": ["how"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if len(inputs) < 2:
            raise ValueError("Join requires exactly two input tables.")
        
        df_left = inputs[0]
        df_right = inputs[1]
        how = params.get("how", "inner").upper()
        
        if how == "CROSS":
            query = "SELECT * FROM df_left, df_right"
        else:
            left_on = params.get("left_on")
            right_on = params.get("right_on")
            if not left_on or not right_on:
                raise ValueError(f"{how} Join requires 'left_on' and 'right_on' parameters.")
            
            query = f"""
                SELECT L.*, R.* EXCLUDE ({right_on})
                FROM df_left L
                {how} JOIN df_right R ON L.{left_on} = R.{right_on}
            """
            
        return self.run_query(query, {"df_left": df_left, "df_right": df_right})
