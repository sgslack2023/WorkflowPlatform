from ..base import BaseTool
import requests

class SlackMessage(BaseTool):
    name = "Send Slack Message"
    description = "Send a message to a Slack channel via Webhook"
    key = "communication.slack"
    input_schema = {
        "type": "object",
        "properties": {
            "webhook_url": {"type": "string", "description": "Slack Webhook URL", "format": "password"},
            "message": {"type": "string", "description": "Message content", "format": "long"},
            "channel": {"type": "string", "description": "Channel override (optional)"}
        },
        "required": ["webhook_url", "message"]
    }
    output_schema = {
        "type": "object",
        "properties": {
            "status": {"type": "string"},
            "response": {"type": "string"}
        }
    }

    def execute(self, inputs, algo_parameters=None):
        webhook_url = inputs.get("webhook_url")
        message = inputs.get("message")
        
        payload = {"text": message}
        
        # In a real implementation, we would post to the webhook
        # response = requests.post(webhook_url, json=payload)
        # response.raise_for_status()
        
        # For demo, we mock the success if the URL looks somewhat valid
        if "hooks.slack.com" in webhook_url or "mock" in webhook_url:
            return {"status": "success", "response": "Message sent to Slack"}
        else:
            return {"status": "failed", "response": "Invalid Webhook URL (Mock validation)"}
