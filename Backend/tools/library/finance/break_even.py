from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class BreakEvenAnalysis(BaseTool):
    name = "Break-Even Analysis"
    key = "finance.break_even"
    description = "Calculates Break-Even Point."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "fixed_costs": {"type": "number"},
            "price_per_unit": {"type": "number"},
            "variable_cost_per_unit": {"type": "number"}
        },
        "required": ["fixed_costs", "price_per_unit", "variable_cost_per_unit"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "bep_units": {"type": "number", "description": "Break-even point in unit sales"},
            "bep_revenue": {"type": "number", "description": "Break-even point in dollar sales"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        fc = inputs['fixed_costs']
        p = inputs['price_per_unit']
        vc = inputs['variable_cost_per_unit']
        
        contribution_margin = p - vc
        if contribution_margin <= 0: return {"error": "Price must be > Variable Cost"}
            
        return {
            "bep_units": round(fc / contribution_margin, 2),
            "bep_revenue": round((fc / contribution_margin) * p, 2)
        }
