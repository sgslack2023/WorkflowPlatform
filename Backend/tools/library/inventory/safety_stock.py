from typing import Dict, Any, Optional
from tools.library.base import BaseTool
import math

class SafetyStockOptimizer(BaseTool):
    name = "Safety Stock Optimizer"
    key = "inventory.safety_stock"
    description = "Calculates Safety Stock."
    execution_mode = "synchronous"
    
    input_schema = {
        "type": "object",
        "properties": {
            "avg_daily_demand": {"type": "number"},
            "std_dev_demand": {"type": "number"},
            "avg_lead_time": {"type": "number"},
            "service_level": {"type": "number", "default": 0.95}
        },
        "required": ["avg_daily_demand", "std_dev_demand", "avg_lead_time"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "safety_stock": {"type": "number"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        Z = 1.65 # Default 95%
        safety_stock = Z * math.sqrt( (inputs['avg_lead_time'] * inputs['std_dev_demand']**2) )
        return {"safety_stock": round(safety_stock, 0)}
