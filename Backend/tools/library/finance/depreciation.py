from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class DepreciationCalculator(BaseTool):
    name = "Depreciation Calculator"
    key = "finance.depreciation"
    description = "Calculates asset depreciation using Straight-line or Declining Balance methods."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "asset_cost": {"type": "number"},
            "salvage_value": {"type": "number", "default": 0},
            "useful_life": {"type": "integer", "description": "Years of life"},
            "method": {"type": "string", "enum": ["straight_line", "declining_balance"], "default": "straight_line"}
        },
        "required": ["asset_cost", "useful_life"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "annual_depreciation": {"type": "number"},
            "schedule": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "year": {"type": "integer"},
                        "expense": {"type": "number"},
                        "book_value": {"type": "number"}
                    }
                }
            }
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        cost = inputs['asset_cost']
        salvage = inputs.get('salvage_value', 0)
        life = inputs['useful_life']
        method = inputs.get('method', 'straight_line')
        
        schedule = []
        book_value = cost
        
        if method == "straight_line":
            annual_expense = (cost - salvage) / life
            for year in range(1, life + 1):
                book_value -= annual_expense
                schedule.append({
                    "year": year,
                    "expense": round(annual_expense, 2),
                    "book_value": round(max(book_value, salvage), 2)
                })
            return {"annual_depreciation": round(annual_expense, 2), "schedule": schedule}
        else:
            # Simple Double Declining Balance
            rate = 2 / life
            for year in range(1, life + 1):
                expense = book_value * rate
                if book_value - expense < salvage:
                    expense = book_value - salvage
                book_value -= expense
                schedule.append({
                    "year": year,
                    "expense": round(expense, 2),
                    "book_value": round(book_value, 2)
                })
            return {"annual_depreciation": round(schedule[0]['expense'], 2), "schedule": schedule}
