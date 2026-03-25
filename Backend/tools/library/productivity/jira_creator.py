from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class JiraIssueCreator(BaseTool):
    name = "Jira Issue Creator"
    key = "productivity.jira"
    description = "Automatically creates Jira tickets from workflow failures or user requests."
    execution_mode = "asynchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "project_key": {"type": "string"},
            "summary": {"type": "string"},
            "description": {"type": "string"},
            "issue_type": {"type": "string", "default": "Bug"}
        },
        "required": ["project_key", "summary"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "issue_key": {"type": "string"},
            "issue_url": {"type": "string"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Mocking Jira API
        key = f"{inputs['project_key']}-123"
        return {
            "issue_key": key,
            "issue_url": f"https://atlassian.net/browse/{key}"
        }
