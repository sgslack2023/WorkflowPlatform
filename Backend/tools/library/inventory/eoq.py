from typing import Dict, Any, Optional
from tools.library.base import BaseTool
import math

class EOQCalculator(BaseTool):
    name = "EOQ Calculator"
    key = "inventory.eoq"
    description = "Calculates Economic Order Quantity."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "demand_rate": {"type": "number"},
            "ordering_cost": {"type": "number"},
            "holding_cost": {"type": "number"}
        },
        "required": ["demand_rate", "ordering_cost", "holding_cost"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "economic_order_quantity": {"type": "number"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        D = inputs['demand_rate']
        S = inputs['ordering_cost']
        H = inputs['holding_cost']
        if H == 0: return {"error": "Holding cost cannot be zero"}
        eoq = math.sqrt((2 * D * S) / H)
        return {"economic_order_quantity": round(eoq, 0)}
