"""LLM client abstraction using OpenAI Responses API."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import os
import json
import logging

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Response from LLM using Responses API."""
    output: List[Dict[str, Any]]  # Event-based output items
    has_tool_calls: bool = False  # Whether response contains function_call items
    has_content: bool = False  # Whether response contains text content


class LLMClient:
    """Base LLM client."""
    
    def run(
        self,
        input_items: List[Dict[str, Any]],
        tools: Optional[List[Dict]] = None,
        instructions: Optional[str] = None
    ) -> LLMResponse:
        """
        Send request using Responses API.
        
        Args:
            input_items: List of input events (messages, function_call_output, etc.)
            tools: Available tools for function calling
            instructions: System instructions/prompt
        
        Returns:
            LLMResponse with output items
        """
        raise NotImplementedError


class OpenAIClient(LLMClient):
    """OpenAI Responses API client."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-5"):
        """
        Initialize OpenAI client.
        
        Args:
            api_key: OpenAI API key (or uses OPENAI_API_KEY env var)
            model: Model name (default: gpt-5)
        """
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")
        
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key required (set OPENAI_API_KEY env var)")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = model
        logger.info(f"Initialized OpenAI client with model: {model}")
    
    def run(
        self,
        input_items: List[Dict[str, Any]],
        tools: Optional[List[Dict]] = None,
        instructions: Optional[str] = None
    ) -> LLMResponse:
        """Send request to OpenAI Responses API."""
        logger.info(f"[LLM] Preparing API request | model={self.model} | input_items={len(input_items)} | tools={len(tools) if tools else 0}")
        logger.debug(f"[LLM] Input items summary | model={self.model} | items={[item.get('type', item.get('role', 'unknown')) for item in input_items]}")
        
        # CRITICAL: Sanitize input_items to ensure:
        # 1. function_call_output items have string outputs
        # 2. function_call items have string arguments
        # The Responses API requires these to be JSON strings, not dicts/objects
        sanitized_input = []
        for item in input_items:
            if item.get("type") == "function_call_output":
                # Ensure output is always a string
                output = item.get("output", "")
                if not isinstance(output, str):
                    # Convert dict/object to JSON string
                    logger.warning(f"[LLM] Converting function_call_output.output to string | model={self.model} | call_id={item.get('call_id')} | was_type={type(output)}")
                    output = json.dumps(output)
                sanitized_item = {
                    "type": "function_call_output",
                    "call_id": item.get("call_id"),
                    "output": output
                }
                sanitized_input.append(sanitized_item)
            elif item.get("type") == "function_call":
                # Ensure arguments is always a string
                arguments = item.get("arguments", {})
                if not isinstance(arguments, str):
                    # Convert dict/object to JSON string
                    logger.warning(f"[LLM] Converting function_call.arguments to string | model={self.model} | call_id={item.get('call_id')} | name={item.get('name')} | was_type={type(arguments)}")
                    arguments = json.dumps(arguments)
                sanitized_item = {
                    "type": "function_call",
                    "call_id": item.get("call_id"),
                    "name": item.get("name"),
                    "arguments": arguments
                }
                sanitized_input.append(sanitized_item)
            else:
                # Pass through other items as-is
                sanitized_input.append(item)
        
        try:
            kwargs = {
                "model": self.model,
                "input": sanitized_input
            }
            
            if tools:
                kwargs["tools"] = tools
                logger.debug(f"[LLM] Tools included | model={self.model} | tool_names={[t.get('function', {}).get('name') for t in tools]}")
            
            if instructions:
                kwargs["instructions"] = instructions
                logger.debug(f"[LLM] Instructions included | model={self.model} | length={len(instructions)}")
            
            logger.info(f"[LLM] Calling OpenAI Responses API | model={self.model}")
            response = self.client.responses.create(**kwargs)
            logger.info(f"[LLM] API response received | model={self.model} | output_items={len(response.output)}")
            
            # Extract output items
            output_items = []
            has_tool_calls = False
            has_content = False
            
            logger.debug(f"[LLM] Processing output items | model={self.model} | count={len(response.output)}")
            for item in response.output:
                item_type = item.type
                logger.debug(f"[LLM] Processing output item | model={self.model} | type={item_type}")
                
                item_dict = {
                    "type": item_type,
                }
                
                # Handle different output types
                if item_type == "function_call":
                    has_tool_calls = True
                    item_dict["call_id"] = item.call_id
                    item_dict["name"] = item.name
                    # Arguments are raw JSON string in Responses API - normalize to dict
                    if isinstance(item.arguments, str):
                        item_dict["arguments"] = json.loads(item.arguments)
                    elif hasattr(item.arguments, "model_dump"):
                        # If it's a Pydantic model, convert to dict
                        item_dict["arguments"] = item.arguments.model_dump()
                    else:
                        # Already a dict or primitive
                        item_dict["arguments"] = item.arguments
                    logger.info(f"[LLM] Function call detected | model={self.model} | name={item.name} | call_id={item.call_id}")
                
                elif item_type == "message":
                    has_content = True
                    item_dict["role"] = item.role if hasattr(item, "role") else "assistant"
                    
                    # Normalize content: extract text from ResponseOutputText objects
                    # item.content can be a list of ResponseOutputText objects or a string
                    if isinstance(item.content, list):
                        # Extract text from each ResponseOutputText object
                        normalized_content = "".join(
                            part.text if hasattr(part, "text") else str(part)
                            for part in item.content
                            if hasattr(part, "text") or isinstance(part, str)
                        )
                    elif hasattr(item.content, "text"):
                        # Single ResponseOutputText object
                        normalized_content = item.content.text
                    else:
                        # Already a string or other primitive
                        normalized_content = str(item.content) if item.content else ""
                    
                    item_dict["content"] = normalized_content
                    content_preview = normalized_content[:100] if normalized_content else ""
                    logger.info(f"[LLM] Message detected | model={self.model} | role={item_dict['role']} | content_length={len(normalized_content)} | preview='{content_preview}...'")
                
                elif item_type == "function_call_output":
                    # NOTE: The Responses API should NOT return function_call_output items
                    # These are things WE send TO the API, not things the API returns.
                    # If we see this, it's unexpected, but we'll preserve it as-is (string output)
                    item_dict["call_id"] = item.call_id
                    # Keep output as string - do NOT parse it
                    # The API returns function_call_output as strings, and we should preserve that
                    if isinstance(item.output, str):
                        item_dict["output"] = item.output
                    elif hasattr(item.output, "model_dump"):
                        # If it's a Pydantic model, convert to string
                        item_dict["output"] = json.dumps(item.output.model_dump())
                    else:
                        # Convert to JSON string
                        item_dict["output"] = json.dumps(item.output)
                    logger.debug(f"[LLM] Function call output (unexpected in API response) | model={self.model} | call_id={item.call_id}")
                
                else:
                    # Preserve other fields
                    item_dict.update(item.model_dump() if hasattr(item, "model_dump") else {})
                    logger.debug(f"[LLM] Unknown output type | model={self.model} | type={item_type}")
                
                output_items.append(item_dict)
            
            logger.info(f"[LLM] Response processed | model={self.model} | has_tool_calls={has_tool_calls} | has_content={has_content} | items={len(output_items)}")
            return LLMResponse(
                output=output_items,
                has_tool_calls=has_tool_calls,
                has_content=has_content
            )
        
        except Exception as e:
            logger.error(f"[LLM] API call failed | model={self.model} | error={str(e)}", exc_info=True)
            # Return error response
            return LLMResponse(
                output=[{
                    "type": "message",
                    "role": "assistant",
                    "content": "I'm having trouble processing your request right now. Please try again in a moment."
                }],
                has_tool_calls=False,
                has_content=True
            )


def create_llm_client(provider: str = "openai", **kwargs) -> LLMClient:
    """
    Create LLM client based on provider.
    
    Args:
        provider: LLM provider (openai, anthropic, local)
        **kwargs: Provider-specific arguments
    
    Returns:
        LLMClient instance
    """
    if provider == "openai":
        return OpenAIClient(**kwargs)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
