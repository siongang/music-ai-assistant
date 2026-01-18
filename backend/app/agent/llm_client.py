"""LLM client abstraction."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import os
import logging

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Response from LLM."""
    content: Optional[str] = None  # Text response
    tool_calls: Optional[List[Dict[str, Any]]] = None  # Tool calls
    finish_reason: str = "stop"  # stop, tool_calls, length, error


class LLMClient:
    """Base LLM client."""
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        """
        Send chat completion request.
        
        Args:
            messages: Conversation history
            tools: Available tools for function calling
            temperature: Sampling temperature
        
        Returns:
            LLMResponse
        """
        raise NotImplementedError


class OpenAIClient(LLMClient):
    """OpenAI API client."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4"):
        """
        Initialize OpenAI client.
        
        Args:
            api_key: OpenAI API key (or uses OPENAI_API_KEY env var)
            model: Model name (default: gpt-4)
        """
        try:
            import openai
        except ImportError:
            raise ImportError("openai package not installed. Run: pip install openai")
        
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key required (set OPENAI_API_KEY env var)")
        
        self.client = openai.OpenAI(api_key=self.api_key)
        self.model = model
        logger.info(f"Initialized OpenAI client with model: {model}")
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        tools: Optional[List[Dict]] = None,
        temperature: float = 0.7
    ) -> LLMResponse:
        """Send chat completion request to OpenAI."""
        try:
            kwargs = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature
            }
            
            if tools:
                kwargs["tools"] = tools
                kwargs["tool_choice"] = "auto"
            
            response = self.client.chat.completions.create(**kwargs)
            
            message = response.choices[0].message
            finish_reason = response.choices[0].finish_reason
            
            # Check if tool calls
            if message.tool_calls:
                tool_calls = []
                for tc in message.tool_calls:
                    import json
                    tool_calls.append({
                        "id": tc.id,
                        "name": tc.function.name,
                        "arguments": json.loads(tc.function.arguments)
                    })
                return LLMResponse(
                    tool_calls=tool_calls,
                    finish_reason="tool_calls"
                )
            
            # Regular text response
            return LLMResponse(
                content=message.content,
                finish_reason=finish_reason
            )
        
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}", exc_info=True)
            # Return generic user-safe error message (don't expose internal details)
            return LLMResponse(
                content="I'm having trouble processing your request right now. Please try again in a moment.",
                finish_reason="error"
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
