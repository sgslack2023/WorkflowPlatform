import pandas as pd
from .base import BaseTransform
from typing import Dict, Any, List

class CalculateTransform(BaseTransform):
    key = "calculate"
    name = "Calculated Column"
    description = "Create a new column using a simple SQL expression (e.g., column1 + column2)."
    
    input_schema = {
        "type": "object",
        "properties": {
            "new_column_name": {
                "type": "string",
                "label": "New Column Name"
            },
            "operation": {
                "type": "string",
                "label": "Operation",
                "enum": ["expression", "concatenate", "year", "month", "day", "date_only"],
                "default": "expression",
                "help_text": "Choose a shortcut operation or write a custom SQL expression."
            },
            "expression": {
                "type": "string",
                "label": "SQL Expression",
                "placeholder": "e.g. qty * unit_price",
                "description": "Only used if Operation is 'expression'"
            },
            "source_column": {
                "type": "string",
                "label": "Source Column",
                "description": "Used for Date/Year/Month/Day extraction"
            },
            "concat_columns": {
                "type": "array",
                "items": {"type": "string"},
                "label": "Columns to Concatenate",
                "description": "Used for Concatenate operation"
            },
            "separator": {
                "type": "string",
                "label": "Separator",
                "default": " ",
                "description": "Used to join columns (e.g. space, comma, or hyphen)"
            }
        },
        "required": ["new_column_name"]
    }

    def execute(self, inputs: List[pd.DataFrame], params: Dict[str, Any]) -> pd.DataFrame:
        if not inputs:
            raise ValueError("Calculate requires at least one input table.")
        
        df = inputs[0]
        new_col = params["new_column_name"]
        operation = params.get("operation", "expression")
        
        # Helper to find column name case-insensitively
        def find_col(name):
            if not name: return name
            target = name.lower()
            for c in df.columns:
                if c.lower() == target:
                    return c
            return name

        if operation == "concatenate":
            cols = [find_col(c) for c in params.get("concat_columns", [])]
            sep = params.get("separator", " ")
            if not cols:
                expr = "''"
            else:
                # DuckDB concatenation with CAST to VARCHAR for safety
                parts = [f"CAST(\"{c}\" AS VARCHAR)" for c in cols]
                joiner = f" || '{sep}' || "
                expr = joiner.join(parts)
        
        elif operation in ("year", "month", "day"):
            source = find_col(params.get("source_column"))
            if not source:
                raise ValueError(f"Source column is required for {operation} extraction")
            # Automatically try to cast to timestamp before extracting
            expr = f"{operation}(TRY_CAST(\"{source}\" AS TIMESTAMP))"
            
        elif operation == "date_only":
            source = find_col(params.get("source_column"))
            if not source:
                raise ValueError("Source column is required for date extraction")
            expr = f"CAST(TRY_CAST(\"{source}\" AS TIMESTAMP) AS DATE)"
            
        else:
            # Custom Expression mode
            expr = params.get("expression", "NULL")
            # If user didn't wrap the expression in parens, we do it for safety
            if not expr.strip().startswith("("):
                expr = f"({expr})"

        query = f"SELECT *, {expr} AS \"{new_col}\" FROM df"
        
        try:
            return self.run_query(query, {"df": df})
        except Exception as e:
            # Fallback for debugging: return error column
            print(f"  [Calculate] Error executing query: {e}")
            df[new_col] = f"Error: {str(e)}"
            return df
