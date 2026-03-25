"""Tool registry for agent."""
from typing import Dict, Any, List
from app.agent.tools.base import Tool
import logging

logger = logging.getLogger(__name__)


class ToolRegistry:
    """
    Central registry for agent tools.
    
    Manages tool registration, discovery, and execution.
    Provides tool schemas for LLM function calling.
    """
    
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
    
    def register(self, tool: Tool):
        """
        Register a tool.
        
        Args:
            tool: Tool instance to register
        """
        if tool.name in self._tools:
            logger.warning(f"Tool {tool.name} already registered, overwriting")
        
        self._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
    
    def get(self, name: str) -> Tool:
        """
        Get a tool by name.
        
        Args:
            name: Tool name
        
        Returns:
            Tool instance
        
        Raises:
            ValueError: If tool not found
        """
        if name not in self._tools:
            raise ValueError(f"Unknown tool: {name}")
        return self._tools[name]
    
    def list_tools(self) -> List[str]:
        """Get list of registered tool names."""
        return list(self._tools.keys())
    
    def get_tool_schemas(self) -> List[Dict[str, Any]]:
        """
        Get all tool schemas for LLM function calling.
        
        Returns:
            List of tool schemas in OpenAI function calling format
        """
        return [tool.to_function_schema() for tool in self._tools.values()]
    
    def execute(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """
        Execute a tool by name with arguments.
        
        Includes input validation and error handling.
        
        Args:
            tool_name: Name of tool to execute
            **kwargs: Tool arguments
        
        Returns:
            Tool execution result
        
        Raises:
            ValueError: If tool not found or arguments invalid
            RuntimeError: If tool execution fails
        """
        tool = self.get(tool_name)
        
        # Validate inputs
        tool.validate_inputs(kwargs)
        
        # Execute
        try:
            logger.info(f"Executing tool: {tool_name} with args: {kwargs}")
            result = tool.execute(**kwargs)
            logger.info(f"Tool {tool_name} completed successfully")
            return result
        except Exception as e:
            logger.error(f"Tool {tool_name} failed: {e}", exc_info=True)
            raise RuntimeError(f"Tool {tool_name} failed: {str(e)}") from e


def create_default_registry(job_service, artifact_service) -> ToolRegistry:
    """
    Create and populate default tool registry.
    
    Args:
        job_service: JobService instance
    Returns:
        Configured ToolRegistry
    """
    from app.agent.tools.separate_stems_tool import SeparateStemsTool
    from app.agent.tools.convert_to_midi_tool import ConvertToMidiTool
    from app.agent.tools.get_job_status_tool import GetJobStatusTool
    
    registry = ToolRegistry()
    
    # Register tools
    registry.register(SeparateStemsTool(job_service, artifact_service))
    registry.register(ConvertToMidiTool(job_service, artifact_service))
    registry.register(GetJobStatusTool(job_service))
    
    return registry
