from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class WikipediaSummary(BaseTool):
    name = "Wikipedia Summary"
    key = "web.wikipedia"
    description = "Fetches concise summaries of entities or topics from Wikipedia."
    execution_mode = "asynchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "sentences": {"type": "integer", "default": 3}
        },
        "required": ["query"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "url": {"type": "string"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Mocking Wikipedia API
        query = inputs['query']
        return {
            "summary": f"Wikipedia summary for '{query}': This is a mocked summary describing the history and key facts about the requested entity.",
            "url": f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}"
        }
