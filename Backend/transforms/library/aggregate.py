import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class AggregateTransform(BaseTransform):
    key = "aggregate"
    name = "Aggregate Data"
    description = "Group rows together and calculate Sum, Mean, Count, etc. for specific columns."
    
    input_schema = {
        "type": "object",
        "properties": {
            "group_by": {
                "type": "array",
                "items": {"type": "string"},
                "label": "Group By Columns"
            },
            "aggregations": {
                "type": "array",
                "label": "Aggregations",
                "items": {
                    "type": "object",
                    "properties": {
                        "column": {"type": "string", "label": "Column"},
                        "function": {
                            "type": "string",
                            "enum": ["sum", "avg", "count", "min", "max"],
                            "label": "Function"
                        }
                    },
                    "required": ["column", "function"]
                }
            }
        },
        "required": ["aggregations"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("Aggregate requires at least one input table.")
        
        df = inputs[0]
        group_by = params.get("group_by", [])
        aggregations = params.get("aggregations", [])
        
        if not aggregations:
            raise ValueError("At least one aggregation must be specified.")
        
        agg_parts = []
        for agg in aggregations:
            col = f"\"{agg['column']}\""
            func = agg["function"].upper()
            alias = f"{func.lower()}_{agg['column']}"
            
            if func in ('SUM', 'AVG', 'STDEV', 'VARIANCE', 'MEDIAN'):
                agg_parts.append(f"{func}(TRY_CAST({col} AS DOUBLE)) AS \"{alias}\"")
            else:
                agg_parts.append(f"{func}({col}) AS \"{alias}\"")
        
        quoted_group_by = [f"\"{g}\"" for g in group_by]
        select_clause = ", ".join(quoted_group_by + agg_parts)
        group_by_clause = f"GROUP BY {', '.join(quoted_group_by)}" if group_by else ""
        
        query = f"SELECT {select_clause} FROM df {group_by_clause}"
        
        return self.run_query(query, {"df": df})
