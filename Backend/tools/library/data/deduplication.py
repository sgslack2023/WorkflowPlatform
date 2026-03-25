from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class Deduplicator(BaseTool):
    name = "Data Deduplication"
    key = "data.dedup"
    description = "Removes duplicate dictionaries from a list based on a specific key."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "data": {"type": "array", "items": {"type": "object"}},
            "key_column": {"type": "string", "description": "Column to check for duplicates"}
        },
        "required": ["data", "key_column"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "unique_data": {"type": "array", "items": {"type": "object"}},
            "removed_count": {"type": "integer"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = inputs['data']
        key_col = inputs['key_column']
        
        seen = set()
        unique = []
        duplicates = []
        
        for item in data:
            val = item.get(key_col)
            if val in seen:
                duplicates.append(item)
            else:
                seen.add(val)
                unique.append(item)
                
        return {
            "unique_data": unique,
            "removed_count": len(duplicates)
        }
