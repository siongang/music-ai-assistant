/**
 * Chat/Agent API Endpoints
 * 
 * Typed functions for chat and agent interaction.
 */

import { apiClient } from '../client';
import {
  ChatMessageRequest,
  ChatMessageResponse,
  SessionCreateResponse,
  SessionHistoryResponse,
} from '../types';

/**
 * Create a new chat session
 * 
 * POST /chat/sessions
 * 
 * @returns SessionCreateResponse with session_id
 * 
 * @example
 * ```ts
 * const session = await createSession();
 * console.log(session.session_id);
 * ```
 */
export async function createSession(): Promise<SessionCreateResponse> {
  return apiClient.post<SessionCreateResponse>('/chat/sessions');
}

/**
 * Send a message to the agent
 * 
 * POST /chat/message
 * 
 * If session_id is not provided, a new session will be created.
 * 
 * @param message - User message
 * @param sessionId - Optional session ID (creates new if not provided)
 * @returns ChatMessageResponse with agent's reply
 * 
 * @example
 * ```ts
 * const response = await sendMessage('Separate the stems from my audio', sessionId);
 * console.log(response.message);
 * ```
 */
export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<ChatMessageResponse> {
  const request: ChatMessageRequest = {
    message,
    ...(sessionId && { session_id: sessionId }),
  };
  
  return apiClient.post<ChatMessageResponse>('/chat/message', request);
}

/**
 * Send a message with an audio file upload
 * 
 * POST /chat/message-with-upload
 * 
 * This endpoint allows uploading an audio file along with a message.
 * The uploaded file becomes the primary audio for the session.
 * 
 * @param message - User message (optional if file is provided)
 * @param file - Audio file to upload
 * @param sessionId - Optional session ID (creates new if not provided)
 * @returns ChatMessageResponse with agent's reply
 * 
 * @example
 * ```ts
 * const response = await sendMessageWithUpload(
 *   'Analyze this audio',
 *   audioFile,
 *   sessionId
 * );
 * ```
 */
export async function sendMessageWithUpload(
  message: string,
  file: File,
  sessionId?: string
): Promise<ChatMessageResponse> {
  // Build additional fields
  const additionalFields: Record<string, string> = {
    message,
  };
  
  if (sessionId) {
    additionalFields.session_id = sessionId;
  }
  
  // Use API client's uploadFile method for proper error handling and timeout support
  return apiClient.uploadFile<ChatMessageResponse>(
    '/chat/message-with-upload',
    file,
    additionalFields
  );
}

/**
 * Get conversation history for a session
 * 
 * GET /chat/sessions/{session_id}/history?limit=...
 * 
 * @param sessionId - Session UUID
 * @param limit - Maximum number of steps to return (default: 50)
 * @returns SessionHistoryResponse with conversation history
 * 
 * @example
 * ```ts
 * const history = await getSessionHistory(sessionId, 20);
 * history.history.forEach(step => {
 *   console.log(`${step.role}: ${step.content}`);
 * });
 * ```
 */
export async function getSessionHistory(
  sessionId: string,
  limit: number = 50
): Promise<SessionHistoryResponse> {
  const endpoint = `/chat/sessions/${sessionId}/history?limit=${limit}`;
  return apiClient.get<SessionHistoryResponse>(endpoint);
}
