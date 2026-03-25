from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class FuzzyMatcher(BaseTool):
    name = "Fuzzy Matcher"
    key = "data.fuzzy_match"
    description = "Matches similar strings based on Levenshtein distance for data deduplication."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "source_list": {"type": "array", "items": {"type": "string"}},
            "target_strings": {"type": "array", "items": {"type": "string"}},
            "threshold": {"type": "number", "default": 0.8, "description": "Similarity threshold (0 to 1)"}
        },
        "required": ["source_list", "target_strings"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "matches": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "target": {"type": "string"},
                        "best_match": {"type": "string"},
                        "score": {"type": "number"}
                    }
                }
            }
        }
    }

    def _levenshtein_ratio(self, s, t):
        if s == t: return 1.0
        rows = len(s) + 1
        cols = len(t) + 1
        dist = [[0 for _ in range(cols)] for _ in range(rows)]
        for i in range(1, rows): dist[i][0] = i
        for i in range(1, cols): dist[0][i] = i
        
        for col in range(1, cols):
            for row in range(1, rows):
                cost = 0 if s[row-1] == t[col-1] else 1
                dist[row][col] = min(dist[row-1][col] + 1, dist[row][col-1] + 1, dist[row-1][col-1] + cost)
        
        ratio = ((len(s) + len(t)) - dist[rows-1][cols-1]) / (len(s) + len(t))
        return ratio

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        source = inputs['source_list']
        targets = inputs['target_strings']
        threshold = inputs.get('threshold', 0.8)
        
        matches = []
        for target in targets:
            best_score = -1
            best_val = None
            for s in source:
                score = self._levenshtein_ratio(target.lower(), s.lower())
                if score > best_score:
                    best_score = score
                    best_val = s
            
            if best_score >= threshold:
                matches.append({"target": target, "best_match": best_val, "score": round(best_score, 2)})
                
        return {"matches": matches}
