from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class NetPresentValue(BaseTool):
    name = "Net Present Value Calculator"
    key = "finance.npv"
    description = "Calculates the NPV of a series of cash flows."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "rate": {"type": "number", "description": "Discount rate (e.g. 0.1 for 10%)"},
            "cash_flows": {
                "type": "array",
                "items": {"type": "number"},
                "description": "List of cash flows. First value is usually negative (initial investment)."
            }
        },
        "required": ["rate", "cash_flows"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "npv": {"type": "number"},
            "is_profitable": {"type": "boolean"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        rate = inputs['rate']
        flows = inputs['cash_flows']
        
        npv = 0
        for t, cash in enumerate(flows):
            npv += cash / ((1 + rate) ** t)
            
        return {
            "npv": round(npv, 2),
            "is_profitable": npv > 0
        }
