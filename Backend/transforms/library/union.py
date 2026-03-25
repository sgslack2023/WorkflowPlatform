import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class UnionTransform(BaseTransform):
    key = "union"
    name = "Union Tables"
    description = "Append rows from one table to another (Union All)."
    
    input_schema = {
        "type": "object",
        "properties": {
            "union_all": {
                "type": "boolean",
                "default": True,
                "label": "Union All",
                "description": "Include duplicates across tables"
            }
        }
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if len(inputs) < 2:
            raise ValueError("Union requires at least two input tables.")
        
        union_op = "UNION ALL" if params.get("union_all", True) else "UNION"
        
        context = {f"df_{i}": df for i, df in enumerate(inputs)}
        queries = [f"SELECT * FROM df_{i}" for i in range(len(inputs))]
        
        final_query = f" {union_op} ".join(queries)
        
        return self.run_query(final_query, context)
