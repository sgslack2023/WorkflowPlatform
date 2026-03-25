from typing import Dict, Any, Optional
from tools.library.base import BaseTool

class FileCompressor(BaseTool):
    name = "File Compressor"
    key = "productivity.compressor"
    description = "Compresses multiple files into a single Zip archive or extracts files."
    execution_mode = "synchronous"

    input_schema = {
        "type": "object",
        "properties": {
            "file_urls": {"type": "array", "items": {"type": "string"}},
            "archive_name": {"type": "string", "default": "archive.zip"}
        },
        "required": ["file_urls"]
    }

    output_schema = {
        "type": "object",
        "properties": {
            "archive_url": {"type": "string"},
            "size_kb": {"type": "number"}
        }
    }

    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Mocking Zip logic
        import time
        return {
            "archive_url": f"https://storage.workflowplatform.com/tmp/{inputs.get('archive_name', 'archive.zip')}",
            "size_kb": len(inputs['file_urls']) * 120 # Mocked size
        }
    
