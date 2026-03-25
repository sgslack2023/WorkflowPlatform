from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class RatioAnalyzer(BaseTool):
    name = "Financial Ratio Analyzer"
    key = "finance.ratios"
    description = "Calculates key financial ratios."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "current_assets": {"type": "number"},
            "current_liabilities": {"type": "number"},
            "inventory": {"type": "number", "default": 0},
            "total_debt": {"type": "number", "default": 0},
            "total_equity": {"type": "number", "default": 1},
            "net_income": {"type": "number", "default": 0},
            "revenue": {"type": "number", "default": 1}
        },
        "required": ["current_assets", "current_liabilities"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "liquidity": {
                "type": "object",
                "properties": {
                    "current_ratio": {"type": "number"},
                    "quick_ratio": {"type": "number"}
                }
            },
            "solvency": {
                "type": "object",
                "properties": {
                    "debt_to_equity": {"type": "number"}
                }
            },
            "profitability": {
                "type": "object",
                "properties": {
                    "net_profit_margin": {"type": "number"}
                }
            }
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        ca = inputs.get('current_assets', 0)
        cl = inputs.get('current_liabilities', 1) 
        inv = inputs.get('inventory', 0)
        debt = inputs.get('total_debt', 0)
        equity = inputs.get('total_equity', 1)
        income = inputs.get('net_income', 0)
        rev = inputs.get('revenue', 1)

        return {
            "liquidity": {
                "current_ratio": round(ca / cl, 2),
                "quick_ratio": round((ca - inv) / cl, 2)
            },
            "solvency": {
                "debt_to_equity": round(debt / equity, 2)
            },
            "profitability": {
                "net_profit_margin": round((income / rev) * 100, 2)
            }
        }
