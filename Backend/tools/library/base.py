from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseTool(ABC):
    """
    Abstract Base Class for all Tools in the library.
    
    Attributes:
        name (str): Human-readable name of the tool.
        key (str): Unique slug identifier (e.g. 'finance.npv').
        description (str): Detailed description of what the tool does.
        input_schema (dict): JSON Schema defining required inputs.
        output_schema (dict): JSON Schema defining return format.
        algo_parameters (dict): Default configuration parameters (e.g. thresholds).
    """
    name: str = ""
    key: str = "" 
    description: str = ""
    input_schema: Dict[str, Any] = {}
    output_schema: Dict[str, Any] = {}
    algo_parameters: Dict[str, Any] = {}
    execution_mode: str = 'synchronous' # 'synchronous' or 'asynchronous'

    @abstractmethod
    def execute(self, inputs: Dict[str, Any], params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute the tool logic.
        
        Args:
            inputs: Runtime data provided by the user/agent.
            params: Algorithm configuration (merged with defaults).
            
        Returns:
            Dict containing the 'result' or other structured output.
        """
        pass
