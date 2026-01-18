"""Base tool class for agent tools."""
from abc import ABC, abstractmethod
from typing import Dict, Any
import jsonschema


class Tool(ABC):
    """
    Base class for agent tools.
    
    Each tool must define:
    - name: Unique tool identifier
    - description: What the tool does (shown to LLM)
    - parameters: JSON Schema for input validation
    - returns: JSON Schema for output (documentation only)
    
    And implement:
    - execute(**kwargs): Tool execution logic
    """
    
    name: str
    description: str
    parameters: Dict[str, Any]  # JSON Schema
    returns: Dict[str, Any]     # JSON Schema (for docs)
    
    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute the tool with given arguments.
        
        Args:
            **kwargs: Tool-specific arguments (validated against self.parameters)
        
        Returns:
            Dict with tool results
        
        Raises:
            ValueError: If arguments are invalid
            RuntimeError: If execution fails
        """
        pass
    
    def validate_inputs(self, kwargs: Dict[str, Any]):
        """Validate inputs against parameter schema."""
        try:
            jsonschema.validate(instance=kwargs, schema=self.parameters)
        except jsonschema.ValidationError as e:
            raise ValueError(f"Invalid arguments for {self.name}: {e.message}")
    
    def to_function_schema(self) -> Dict[str, Any]:
        """
        Convert tool to OpenAI function calling schema.
        
        Returns:
            Dict in OpenAI function calling format
        """
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }
