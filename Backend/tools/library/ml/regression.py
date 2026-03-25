from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class SimpleRegression(BaseTool):
    name = "Linear Regression"
    key = "ml.regression.linear"
    description = "Performs simple linear regression (y = mx + c)."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "x_values": {"type": "array", "items": {"type": "number"}},
            "y_values": {"type": "array", "items": {"type": "number"}}
        },
        "required": ["x_values", "y_values"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "slope": {"type": "number"},
            "intercept": {"type": "number"},
            "equation": {"type": "string"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        x = inputs['x_values']
        y = inputs['y_values']
        n = len(x)
        
        if n != len(y) or n == 0:
            return {"error": "Input arrays must have same non-zero length"}
            
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(i*j for i, j in zip(x, y))
        sum_xx = sum(i*i for i in x)
        
        denominator = (n * sum_xx - sum_x * sum_x)
        if denominator == 0:
            return {"error": "Vertical line (undefined slope)"}
            
        slope = (n * sum_xy - sum_x * sum_y) / denominator
        intercept = (sum_y - slope * sum_x) / n
        
        return {
            "slope": round(slope, 4),
            "intercept": round(intercept, 4),
            "equation": f"y = {round(slope, 4)}x + {round(intercept, 4)}"
        }
