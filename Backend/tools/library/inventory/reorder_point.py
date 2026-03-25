from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class ReorderPointCalculator(BaseTool):
    name = "Reorder Point Calculator"
    key = "inventory.reorder_point"
    description = "Calculates the inventory level at which a new order should be placed."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "avg_daily_usage": {"type": "number"},
            "lead_time_days": {"type": "integer"},
            "safety_stock": {"type": "number", "default": 0}
        },
        "required": ["avg_daily_usage", "lead_time_days"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "reorder_point": {"type": "number"},
            "lead_time_demand": {"type": "number"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        usage = inputs['avg_daily_usage']
        lead_time = inputs['lead_time_days']
        safety = inputs.get('safety_stock', 0)
        
        lt_demand = usage * lead_time
        rop = lt_demand + safety
        
        return {
            "reorder_point": round(rop, 2),
            "lead_time_demand": round(lt_demand, 2)
        }
