from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class TaktTimeCalculator(BaseTool):
    name = "Takt Time Calculator"
    key = "production.takt"
    description = "Calculates the required production pace to meet demand."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "available_time_minutes": {"type": "number"},
            "customer_demand": {"type": "number"}
        },
        "required": ["available_time_minutes", "customer_demand"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "takt_time_minutes": {"type": "number"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        time = inputs['available_time_minutes']
        demand = inputs['customer_demand']
        
        if demand == 0: return {"error": "Demand cannot be zero"}
        
        takt = time / demand
        return {"takt_time_minutes": round(takt, 2)}
