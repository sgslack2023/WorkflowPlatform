from typing import Dict, Any, Optional
from tools.library.base import BaseTool
import statistics

class AnomalyDetection(BaseTool):
    name = "Anomaly Detection"
    key = "forecasting.anomaly_detection"
    description = "Identifies outliers in time-series data using Z-score analysis."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "data": {"type": "array", "items": {"type": "number"}},
            "threshold": {"type": "number", "default": 2.0, "description": "Z-score threshold (usually 2.0 or 3.0)"}
        },
        "required": ["data"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "anomalies": {
                "type": "array", 
                "items": {
                    "type": "object",
                    "properties": {
                        "index": {"type": "integer"},
                        "value": {"type": "number"},
                        "z_score": {"type": "number"}
                    }
                }
            },
            "anomaly_count": {"type": "integer"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = inputs['data']
        threshold = inputs.get('threshold', 2.0)
        
        if len(data) < 2:
            return {"anomalies": [], "anomaly_count": 0}
            
        mean = statistics.mean(data)
        stdev = statistics.stdev(data)
        
        if stdev == 0:
            return {"anomalies": [], "anomaly_count": 0}
            
        anomalies = []
        for i, val in enumerate(data):
            z = (val - mean) / stdev
            if abs(z) > threshold:
                anomalies.append({
                    "index": i,
                    "value": val,
                    "z_score": round(z, 2)
                })
                
        return {
            "anomalies": anomalies,
            "anomaly_count": len(anomalies)
        }
