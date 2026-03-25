from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class OEECalculator(BaseTool):
    name = "OEE Calculator"
    key = "production.oee"
    description = "Calculates Overall Equipment Effectiveness."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "planned_production_time": {"type": "number", "description": "Total time in minutes"},
            "downtime": {"type": "number", "description": "Downtime in minutes"},
            "ideal_cycle_time": {"type": "number", "description": "Min/unit"},
            "total_count": {"type": "integer"},
            "good_count": {"type": "integer"}
        },
        "required": ["planned_production_time", "total_count", "good_count"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "oee_percentage": {"type": "number"},
            "availability": {"type": "number"},
            "performance": {"type": "number"},
            "quality": {"type": "number"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        planned_time = inputs['planned_production_time']
        downtime = inputs.get('downtime', 0)
        run_time = planned_time - downtime
        
        availability = run_time / planned_time if planned_time > 0 else 0
        
        ideal_cycle = inputs.get('ideal_cycle_time', 0)
        total_count = inputs['total_count']
        performance = (ideal_cycle * total_count) / run_time if run_time > 0 else 0
        
        good_count = inputs['good_count']
        quality = good_count / total_count if total_count > 0 else 0
        
        oee = availability * performance * quality
        
        return {
            "oee_percentage": round(oee * 100, 2),
            "availability": round(availability * 100, 2),
            "performance": round(performance * 100, 2),
            "quality": round(quality * 100, 2)
        }
