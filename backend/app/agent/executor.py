"""Agent executor - main agent runtime loop."""
from uuid import UUID
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
import logging

from app.agent.llm_client import LLMClient, LLMResponse
from app.agent.tools.registry import ToolRegistry
from app.agent.session_service import SessionService

logger = logging.getLogger(__name__)


@dataclass
class AgentResponse:
    """Response from agent."""
    message: str
    done: bool = True
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)


class AgentExecutor:
    """
    Main agent runtime.
    
    Orchestrates:
    - User message processing
    - LLM-based tool selection
    - Tool execution
    - Response generation
    """
    
    SYSTEM_PROMPT = """You are a music processing assistant. You help users process audio files using various tools.

Available capabilities:
- Separate audio into stems (vocals, drums, bass, other) using Demucs
- Convert audio to MIDI format using BasicPitch
- Check status of processing jobs

Important:
- Processing jobs run in the background and take 1-5 minutes
- Always create jobs first, then check their status
- You cannot analyze music theory yet (no chord detection, key detection, etc.)
- Be helpful and explain what you're doing

Audio context:
- This chat session is scoped to ONE primary audio file (provided below)
- When the user says "the song", "the audio", "that file", "it", or similar references, they mean the primary audio for this session
- You should use the primary audio_id automatically - do not ask the user for it
- If the user explicitly provides a different audio_id, use that instead
- The primary audio context will be provided in the system prompt below

When users ask to process audio, use the appropriate tool and explain what's happening."""
    
    def __init__(
        self,
        llm_client: LLMClient,
        tool_registry: ToolRegistry,
        session_service: SessionService,
        max_steps: int = 10
    ):
        """
        Initialize agent executor.
        
        Args:
            llm_client: LLM client for reasoning
            tool_registry: Tool registry for execution
            session_service: Session service for state management
            max_steps: Maximum steps per request (safety limit)
        """
        self.llm = llm_client
        self.tools = tool_registry
        self.sessions = session_service
        self.max_steps = max_steps
    
    def process_message(self, session_id: UUID, user_message: str) -> AgentResponse:
        """
        Process user message and return agent response.
        
        This is the main agent loop:
        1. Load session context
        2. Add user message to history
        3. Run agent reasoning loop (up to max_steps)
        4. Return final response
        
        Args:
            session_id: Session UUID
            user_message: User's message
        
        Returns:
            AgentResponse with final message
        """
        logger.info(f"Processing message for session {session_id}")
        
        # Ensure session exists
        session = self.sessions.get_or_create_session(session_id)
        
        # Log user message
        self.sessions.add_step(
            session_id,
            step_type="user_message",
            content={"role": "user", "content": user_message}
        )
        
        # Get conversation history for LLM
        # Note: get_messages_for_llm already includes the user message we just logged,
        # so we don't need to append it again
        conversation_messages = self.sessions.get_messages_for_llm(session_id)
        
        # Agent loop
        step_count = 0
        tool_results = []  # Track tool results for this turn
        
        # Get primary audio for this session
        primary_audio = self.sessions.get_primary_audio(session_id)
        
        while step_count < self.max_steps:
            step_count += 1
            logger.debug(f"Agent step {step_count}/{self.max_steps}")
            
            # Build system prompt with primary audio context
            system_prompt = self.SYSTEM_PROMPT
            if primary_audio:
                audio_context = "\n\n**Active Audio Context:**\n"
                audio_context += f"- audio_id: {primary_audio['audio_id']}\n"
                if "filename" in primary_audio:
                    audio_context += f"- filename: {primary_audio['filename']}\n"
                audio_context += "\nWhen the user refers to 'the song', 'the audio', 'that file', 'it', or similar, "
                audio_context += f"they mean this audio (audio_id: {primary_audio['audio_id']}). "
                audio_context += "Use this audio_id automatically in tool calls unless the user explicitly provides a different one."
                system_prompt = system_prompt + audio_context
            else:
                # No primary audio set - inform LLM to ask user to upload
                system_prompt = system_prompt + "\n\n**Note:** No audio file has been uploaded for this session yet. If the user asks to process audio, ask them to upload an audio file first."
            
            # Build messages with system prompt
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(conversation_messages)
            
            # Add tool results if any
            if tool_results:
                tool_summary = "Tool results:\n" + "\n".join([
                    f"- {tr['tool']}: {tr['result']}"
                    for tr in tool_results
                ])
                messages.append({
                    "role": "user",
                    "content": tool_summary
                })
            
            # Get next action from LLM
            llm_response = self.llm.chat(
                messages=messages,
                tools=self.tools.get_tool_schemas(),
                temperature=0.7
            )
            
            # Handle response
            if llm_response.tool_calls:
                # Execute tools
                for tool_call in llm_response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["arguments"]
                    
                    logger.info(f"Executing tool: {tool_name} with args: {tool_args}")
                    
                    # Log tool call
                    self.sessions.add_step(
                        session_id,
                        step_type="tool_call",
                        content={
                            "tool": tool_name,
                            "arguments": tool_args
                        }
                    )
                    
                    # Execute tool
                    try:
                        result = self.tools.execute(tool_name, **tool_args)
                        
                        # Log result
                        self.sessions.add_step(
                            session_id,
                            step_type="tool_result",
                            content={
                                "tool": tool_name,
                                "result": result
                            }
                        )
                        
                        # Track for next LLM call
                        tool_results.append({
                            "tool": tool_name,
                            "result": result
                        })
                        
                    except Exception as e:
                        error_msg = str(e)
                        logger.error(f"Tool {tool_name} failed: {error_msg}")
                        
                        # Log error
                        self.sessions.add_step(
                            session_id,
                            step_type="error",
                            content={
                                "tool": tool_name,
                                "error": error_msg
                            }
                        )
                        
                        # Track error for next LLM call
                        tool_results.append({
                            "tool": tool_name,
                            "error": error_msg
                        })
                
                # Continue loop to let LLM respond to user
                continue
            
            elif llm_response.content:
                # LLM has final response for user
                response_text = llm_response.content
                
                # Log agent response
                self.sessions.add_step(
                    session_id,
                    step_type="agent_response",
                    content={
                        "role": "assistant",
                        "content": response_text
                    }
                )
                
                return AgentResponse(
                    message=response_text,
                    done=True,
                    metadata={
                        "steps": step_count,
                        "tools_used": [tr["tool"] for tr in tool_results]
                    }
                )
            
            else:
                # Unexpected response
                logger.error(f"Unexpected LLM response: {llm_response}")
                return AgentResponse(
                    message="I encountered an error processing your request.",
                    done=True
                )
        
        # Max steps reached
        logger.warning(f"Max steps ({self.max_steps}) reached for session {session_id}")
        return AgentResponse(
            message="I need more steps to complete this task. Please try rephrasing your request.",
            done=False,
            metadata={"steps": step_count, "max_steps_reached": True}
        )
