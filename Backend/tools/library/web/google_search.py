from ..base import BaseTool

class GoogleSearch(BaseTool):
    name = "Google Search"
    description = "Search the web using Google (Mocked for Demo)"
    key = "web.google_search"
    input_schema = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"},
            "num_results": {"type": "integer", "default": 5, "description": "Number of results to return"}
        },
        "required": ["query"]
    }
    output_schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "link": {"type": "string"},
                "snippet": {"type": "string"}
            }
        }
    }

    def execute(self, inputs, algo_parameters=None):
        query = inputs.get("query")
        num = inputs.get("num_results", 5)
        
        # In a real implementation, we would use serpapi or google-search-results
        # For this demo/MVP, we return mock data to demonstrate the flow.
        
        return [
            {
                "title": f"Result {i+1} for {query}",
                "link": f"https://example.com/search?q={query}&id={i}",
                "snippet": f"This is a mocked search result snippet for the query '{query}' showing result number {i+1}."
            }
            for i in range(num)
        ]
