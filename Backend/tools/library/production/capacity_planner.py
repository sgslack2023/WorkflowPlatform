from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class CapacityPlanner(BaseTool):
    name = "Capacity Planner"
    key = "production.capacity_planning"
    description = "Calculates resource utilization and identifies potential production bottlenecks."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "available_hours": {"type": "number", "description": "Total machine/human hours available"},
            "required_hours": {"type": "number", "description": "Total hours needed for production demand"},
            "efficiency_factor": {"type": "number", "default": 1.0, "description": "0.0 to 1.0"}
        },
        "required": ["available_hours", "required_hours"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "utilization_percentage": {"type": "number"},
            "capacity_status": {"type": "string", "enum": ["Under Capacity", "At Capacity", "Over Capacity"]},
            "hour_gap": {"type": "number"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        avail = inputs['available_hours']
        req = inputs['required_hours']
        eff = inputs.get('efficiency_factor', 1.0)
        
        effective_capacity = avail * eff
        utilization = (req / effective_capacity) if effective_capacity > 0 else 0
        gap = effective_capacity - req
        
        status = "Under Capacity"
        if utilization > 1.0:
            status = "Over Capacity"
        elif utilization > 0.9:
            status = "At Capacity"
            
        return {
            "utilization_percentage": round(utilization * 100, 2),
            "capacity_status": status,
            "hour_gap": round(gap, 2)
        }
