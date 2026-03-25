from typing import Dict, Any, Optional
from tools.library.base import BaseTool
import math

class CorrelationMatrix(BaseTool):
    name = "Correlation Matrix"
    key = "ml.correlation"
    description = "Calculates Pearson correlation coefficients between multiple numerical columns."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "columns": {
                "type": "object",
                "additionalProperties": {"type": "array", "items": {"type": "number"}},
                "description": "Object where keys are column names and values are data arrays"
            }
        },
        "required": ["columns"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "matrix": {
                "type": "object",
                "additionalProperties": {
                    "type": "object",
                    "additionalProperties": {"type": "number"}
                }
            }
        }
    }

    def _pearson(self, x, y):
        n = len(x)
        if n != len(y) or n < 2: return 0
        mu_x = sum(x) / n
        mu_y = sum(y) / n
        
        num = sum((xi - mu_x) * (yi - mu_y) for xi, yi in zip(x, y))
        den_x = sum((xi - mu_x)**2 for xi in x)
        den_y = sum((yi - mu_y)**2 for yi in y)
        
        if den_x == 0 or den_y == 0: return 0
        return num / math.sqrt(den_x * den_y)

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        cols = inputs['columns']
        names = list(cols.keys())
        matrix = {}
        
        for name_a in names:
            matrix[name_a] = {}
            for name_b in names:
                if name_a == name_b:
                    matrix[name_a][name_b] = 1.0
                else:
                    matrix[name_a][name_b] = round(self._pearson(cols[name_a], cols[name_b]), 4)
                    
        return {"matrix": matrix}
