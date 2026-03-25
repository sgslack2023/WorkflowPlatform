from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class CAGRCalculator(BaseTool):
    name = "CAGR Calculator"
    key = "forecasting.cagr"
    description = "Calculates Compound Annual Growth Rate for any metric over a specific period."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "beginning_value": {"type": "number"},
            "ending_value": {"type": "number"},
            "num_periods": {"type": "number", "description": "Number of years or periods"}
        },
        "required": ["beginning_value", "ending_value", "num_periods"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "cagr": {"type": "number", "description": "Growth rate as a decimal (e.g. 0.15 for 15%)"},
            "percentage_string": {"type": "string"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        bv = inputs['beginning_value']
        ev = inputs['ending_value']
        n = inputs['num_periods']
        
        if bv <= 0 or n <= 0:
            return {"cagr": 0, "percentage_string": "0% (Invalid Input)"}
            
        cagr = (ev / bv) ** (1 / n) - 1
        
        return {
            "cagr": round(cagr, 4),
            "percentage_string": f"{round(cagr * 100, 2)}%"
        }
