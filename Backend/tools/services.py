import importlib
import logging
from django.utils import timezone
from .models import ToolExecution

logger = logging.getLogger(__name__)

class ToolExecutionService:
    def execute_tool(self, tool, input_data, user=None):
        """
        Dynamically loads the Tool Class and executes it.
        """
        execution = ToolExecution.objects.create(
            tool=tool,
            input_data=input_data,
            status='running',
            started_at=timezone.now(),
            # executed_by=user  # If we add this field later
        )

        try:
            # 1. Load the Module & Class
            module_name, class_name = tool.python_path.rsplit('.', 1)
            module = importlib.import_module(module_name)
            ToolClass = getattr(module, class_name)
            
            # 2. Instantiate
            tool_instance = ToolClass()
            
            # 3. Validation (Optional Step - could use Pydantic/JSONSchema validation here)
            # validate_schema(input_data, tool.input_schema)

            # 4. Execute
            # Merge stored algo_parameters with any runtime overrides if valid
            params = tool.algo_parameters
            
            logger.info(f"Executing tool {tool.key}...")
            result = tool_instance.execute(input_data, params)
            
            execution.output_data = result
            execution.status = 'success'
            
        except Exception as e:
            logger.error(f"Tool execution failed: {e}", exc_info=True)
            execution.status = 'failed'
            execution.error_message = str(e)
            execution.output_data = {"error": str(e)}
            
        finally:
            execution.ended_at = timezone.now()
            if execution.started_at:
                delta = execution.ended_at - execution.started_at
                execution.duration_ms = int(delta.total_seconds() * 1000)
            execution.save()
            
        return execution
