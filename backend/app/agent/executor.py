"""Agent executor - main agent runtime loop using Responses API."""
from uuid import UUID
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
import json
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
    Main agent runtime using event-based Responses API.
    
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
- Jobs are artifact-backed. Output results are references to generated artifacts, not inline files
- If a tool reports that no confidence or reliability score exists, do not invent one

Audio context:
- This chat session is scoped to ONE primary audio file (provided below)
- When the user says "the song", "the audio", "that file", "it", or similar references, they mean the primary audio for this session
- Prefer using the primary artifact id automatically - do not ask the user for it
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
    
    def _build_input_items(
        self,
        conversation_messages: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """
        Build initial input items for Responses API from conversation history.
        
        Args:
            conversation_messages: List of messages from session
        
        Returns:
            List of input items for Responses API
        """
        input_items = []
        
        # Add conversation messages
        for msg in conversation_messages:
            input_items.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        return input_items
    
    def process_message(self, session_id: UUID, user_message: str) -> AgentResponse:
        """
        Process user message and return agent response.
        
        This is the main agent loop using Responses API:
        1. Load session context
        2. Add user message to history
        3. Run event-based agent loop (up to max_steps)
        4. Return final response
        
        Args:
            session_id: Session UUID
            user_message: User's message
        
        Returns:
            AgentResponse with final message
        """
        logger.info(f"[AGENT] Processing message | session={session_id} | message='{user_message[:100]}...'")
        
        # Ensure session exists
        session = self.sessions.get_or_create_session(session_id)
        logger.debug(f"[AGENT] Session ready | session={session_id} | created={session.created_at}")
        
        # Log user message
        self.sessions.add_step(
            session_id,
            step_type="user_message",
            content={"role": "user", "content": user_message}
        )
        
        # Get conversation history for LLM
        conversation_messages = self.sessions.get_messages_for_llm(session_id)
        logger.info(f"[AGENT] Conversation history | session={session_id} | message_count={len(conversation_messages)}")
        
        # Get primary audio for this session
        primary_audio = self.sessions.get_primary_audio(session_id)
        if primary_audio:
            logger.info(
                f"[AGENT] Primary audio context | session={session_id} | "
                f"artifact_id={primary_audio.get('artifact_id')} | "
                f"filename={primary_audio.get('filename', 'unknown')}"
            )
        else:
            logger.info(f"[AGENT] No primary audio | session={session_id}")
        
        # Build system prompt with primary audio context
        system_prompt = self.SYSTEM_PROMPT
        if primary_audio:
            audio_context = "\n\n**Active Audio Context:**\n"
            audio_context += f"- input_artifact_id: {primary_audio['artifact_id']}\n"
            if "filename" in primary_audio:
                audio_context += f"- filename: {primary_audio['filename']}\n"
            audio_context += "\nWhen the user refers to 'the song', 'the audio', 'that file', 'it', or similar, "
            audio_context += (
                f"they mean this uploaded source artifact ({primary_audio['artifact_id']}). "
                f"Prefer input_artifact_id {primary_audio['artifact_id']} in tool calls."
            )
            system_prompt = system_prompt + audio_context
        else:
            # No primary audio set - inform LLM to ask user to upload
            system_prompt = system_prompt + "\n\n**Note:** No audio file has been uploaded for this session yet. If the user asks to process audio, ask them to upload an audio file first."
        
        # Agent loop with event-based Responses API
        step_count = 0
        tool_results = []  # Track tool results for metadata
        input_items = self._build_input_items(conversation_messages)
        
        # Get tool schemas
        tool_schemas = self.tools.get_tool_schemas()
        logger.info(f"[AGENT] Available tools | session={session_id} | tool_count={len(tool_schemas)} | tools={[t.get('function', {}).get('name') for t in tool_schemas]}")
        
        while step_count < self.max_steps:
            step_count += 1
            logger.info(f"[AGENT] Step {step_count}/{self.max_steps} | session={session_id}")
            
            # Call Responses API
            logger.debug(f"[AGENT] Calling LLM | session={session_id} | step={step_count} | input_items={len(input_items)}")
            llm_response = self.llm.run(
                input_items=input_items,
                tools=tool_schemas,
                instructions=system_prompt
            )
            logger.info(f"[AGENT] LLM response received | session={session_id} | step={step_count} | output_items={len(llm_response.output)} | has_tool_calls={llm_response.has_tool_calls} | has_content={llm_response.has_content}")
            
            # Add response output to input_items for next iteration
            input_items.extend(llm_response.output)
            
            # Process output events
            has_tool_calls = False
            final_content = None
            
            for item in llm_response.output:
                if item["type"] == "function_call":
                    has_tool_calls = True
                    call_id = item["call_id"]
                    tool_name = item["name"]
                    tool_args = item["arguments"]
                    
                    logger.info(f"[AGENT] Tool call | session={session_id} | step={step_count} | tool={tool_name} | call_id={call_id}")
                    logger.debug(f"[AGENT] Tool arguments | session={session_id} | tool={tool_name} | args={json.dumps(tool_args, indent=2)}")
                    
                    # Log tool call
                    self.sessions.add_step(
                        session_id,
                        step_type="tool_call",
                        content={
                            "tool": tool_name,
                            "arguments": tool_args,
                            "call_id": call_id
                        }
                    )
                    
                    # Execute tool
                    try:
                        logger.info(f"[AGENT] Executing tool | session={session_id} | tool={tool_name} | call_id={call_id} | args={json.dumps(tool_args)}")
                        result = self.tools.execute(tool_name, **tool_args)
                        
                        # Extract key information from result for logging
                        job_id = result.get("job_id") if isinstance(result, dict) else None
                        status = result.get("status") if isinstance(result, dict) else None
                        
                        if job_id:
                            logger.info(f"[AGENT] Tool executed successfully | session={session_id} | tool={tool_name} | call_id={call_id} | job_id={job_id} | status={status}")
                        else:
                            logger.info(f"[AGENT] Tool executed successfully | session={session_id} | tool={tool_name} | call_id={call_id} | result_keys={list(result.keys()) if isinstance(result, dict) else 'N/A'}")
                        
                        logger.debug(f"[AGENT] Tool result (full) | session={session_id} | tool={tool_name} | result={json.dumps(result, indent=2)}")
                        
                        # Log result
                        self.sessions.add_step(
                            session_id,
                            step_type="tool_result",
                            content={
                                "tool": tool_name,
                                "result": result,
                                "call_id": call_id
                            }
                        )
                        
                        # Append function_call_output to input_items for continuation
                        input_items.append({
                            "type": "function_call_output",
                            "call_id": call_id,
                            "output": json.dumps(result)
                        })
                        
                        # Track for metadata
                        tool_results.append({
                            "tool": tool_name,
                            "result": result,
                            "call_id": call_id
                        })
                        
                    except Exception as e:
                        error_msg = str(e)
                        logger.error(f"[AGENT] Tool execution failed | session={session_id} | tool={tool_name} | call_id={call_id} | error={error_msg}", exc_info=True)
                        
                        # Log error
                        self.sessions.add_step(
                            session_id,
                            step_type="error",
                            content={
                                "tool": tool_name,
                                "error": error_msg,
                                "call_id": call_id
                            }
                        )
                        
                        # Append error as function_call_output
                        input_items.append({
                            "type": "function_call_output",
                            "call_id": call_id,
                            "output": json.dumps({"error": error_msg})
                        })
                        
                        # Track for metadata
                        tool_results.append({
                            "tool": tool_name,
                            "error": error_msg,
                            "call_id": call_id
                        })
                
                elif item["type"] == "message":
                    # Extract content from message (should already be normalized to string by LLM client)
                    final_content = item.get("content", "")
                    # Safety check: ensure it's a string (not an SDK object)
                    if not isinstance(final_content, str):
                        logger.warning(f"[AGENT] Content is not a string, converting | session={session_id} | type={type(final_content)}")
                        final_content = str(final_content)
                    logger.info(f"[AGENT] LLM message received | session={session_id} | step={step_count} | content_length={len(final_content)}")
                    logger.debug(f"[AGENT] Message content | session={session_id} | content='{final_content[:200]}...'")
            
            # If we have tool calls, continue the loop
            if has_tool_calls:
                logger.info(f"[AGENT] Continuing loop (tool calls pending) | session={session_id} | step={step_count}")
                continue
            
            # If we have final content, return it
            if final_content:
                logger.info(f"[AGENT] Final response ready | session={session_id} | steps={step_count} | tools_used={[tr['tool'] for tr in tool_results]}")
                # Log agent response
                self.sessions.add_step(
                    session_id,
                    step_type="agent_response",
                    content={
                        "role": "assistant",
                        "content": final_content
                    }
                )
                
                return AgentResponse(
                    message=final_content,
                    done=True,
                    metadata={
                        "steps": step_count,
                        "tools_used": [tr["tool"] for tr in tool_results]
                    }
                )
        
        # Max steps reached
        logger.warning(f"[AGENT] Max steps reached | session={session_id} | max_steps={self.max_steps}")
        return AgentResponse(
            message="I need more steps to complete this task. Please try rephrasing your request.",
            done=False,
            metadata={"steps": step_count, "max_steps_reached": True}
        )
