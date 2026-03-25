from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class ABCAnalysis(BaseTool):
    name = "ABC Inventory Analysis"
    key = "inventory.abc"
    description = "Classifies inventory into A/B/C categories."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "items": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "string"}, "value": {"type": "number"}}}}
        },
        "required": ["items"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "classified_items": {
                "type": "array",
                "items": {"type": "object", "properties": {"id": {"type": "string"}, "category": {"type": "string"}}}
            }
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        items = sorted(inputs['items'], key=lambda x: x['value'], reverse=True)
        total = sum(i['value'] for i in items)
        running = 0
        results = []
        for i in items:
            running += i['value']
            pct = running / total
            cat = 'A' if pct <= 0.8 else ('B' if pct <= 0.95 else 'C')
            results.append({"id": i['id'], "category": cat})
        return {"classified_items": results}
