/**
 * API Client Index
 * 
 * Re-exports all API client functionality for easy importing.
 * 
 * Usage:
 *   import { uploadAudio, createJob, sendMessage } from '@/api-client'
 */

// Core client and config
export { apiClient, ApiClient } from './client';
export type { RequestOptions } from './client';
export {
  API_BASE_URL,
  DEFAULT_TIMEOUT,
  DEFAULT_POLL_INTERVAL,
  MAX_POLL_ATTEMPTS,
} from './config';

// Types
export {
  JobStatus,
  JobType,
  ApiError,
} from './types';

export type {
  AudioUploadResponse,
  AudioMetadata,
  JobCreateRequest,
  JobDTO,
  ChatMessageRequest,
  ChatMessageResponse,
  SessionCreateResponse,
  SessionHistoryResponse,
  ApiErrorResponse,
} from './types';

// Audio endpoints
export {
  uploadAudio,
  downloadAudio,
  downloadFile,
  getAudioMetadata,
} from './endpoints/audio';

// Job endpoints
export {
  createJob,
  getJob,
  listJobs,
  pollJobUntilComplete,
  separateStemsAndWait,
} from './endpoints/jobs';

// Chat endpoints
export {
  createSession,
  sendMessage,
  sendMessageWithUpload,
  getSessionHistory,
} from './endpoints/chat';
