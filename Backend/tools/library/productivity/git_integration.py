from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class GitIntegration(BaseTool):
    name = "Git Integration"
    key = "productivity.git"
    description = "Triggers CI/CD pipelines or creates issues on GitHub and GitLab repositories."
    execution_mode = "asynchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "repository": {"type": "string", "description": "owner/repo"},
            "action": {"type": "string", "enum": ["create_issue", "trigger_pipeline"]},
            "title": {"type": "string", "description": "Used if action is create_issue"},
            "branch": {"type": "string", "default": "main"}
        },
        "required": ["repository", "action"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "status": {"type": "string"},
            "url": {"type": "string"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Mocking Git API
        return {
            "status": "triggered" if inputs['action'] == "trigger_pipeline" else "created",
            "url": f"https://github.com/{inputs['repository']}/actions"
        }
