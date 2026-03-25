from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class MovingAverage(BaseTool):
    name = "Moving Average"
    key = "forecasting.moving_average"
    description = "Calculates Simple (SMA) or Exponential (EMA) moving averages for trend smoothing."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "data": {"type": "array", "items": {"type": "number"}, "description": "List of numerical values"},
            "window": {"type": "integer", "default": 5, "description": "Smoothing window size"},
            "type": {"type": "string", "enum": ["simple", "exponential"], "default": "simple"}
        },
        "required": ["data"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "smoothed_data": {"type": "array", "items": {"type": "number"}},
            "last_value": {"type": "number"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        data = inputs['data']
        window = inputs.get('window', 5)
        mode = inputs.get('type', 'simple')
        
        if len(data) < window:
            return {"smoothed_data": data, "last_value": data[-1] if data else 0}

        results = []
        if mode == "simple":
            for i in range(len(data)):
                if i < window - 1:
                    results.append(data[i])
                else:
                    avg = sum(data[i - window + 1 : i + 1]) / window
                    results.append(round(avg, 2))
        else:
            # Simple EMA mock
            alpha = 2 / (window + 1)
            ema = data[0]
            results.append(ema)
            for i in range(1, len(data)):
                ema = (data[i] * alpha) + (ema * (1 - alpha))
                results.append(round(ema, 2))

        return {
            "smoothed_data": results,
            "last_value": results[-1]
        }
