/**
 * API Client Types
 * 
 * TypeScript types for API requests and responses.
 * These match the backend Pydantic schemas.
 */

/**
 * Job statuses (matches backend JobStatus)
 */
export enum JobStatus {
  Queued = 'queued',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

/**
 * Job types (matches backend JobType)
 */
export enum JobType {
  StemSeparation = 'stem_separation',
  MidiConversion = 'midi_conversion',
  MelodyExtraction = 'melody_extraction',
  ChordAnalysis = 'chord_analysis',
}

/**
 * Audio upload response DTO
 * Matches backend AudioResponse schema
 */
export interface AudioUploadResponse {
  audio_id: string;
  filename: string;
}

/**
 * Audio metadata (for future use)
 */
export interface AudioMetadata {
  audio_id: string;
  filename: string;
  duration?: number;
  sample_rate?: number;
  channels?: number;
  format?: string;
}

/**
 * Job creation request DTO
 * Matches backend JobCreate schema
 */
export interface JobCreateRequest {
  type: JobType | string;
  input: {
    audio_id: string;
  };
  params?: Record<string, unknown>;
}

/**
 * Job response DTO
 * Matches backend JobResponse schema
 */
export interface JobDTO {
  job_id: string;
  type: string;
  status: JobStatus;
  audio_id: string;
  input: Record<string, unknown>;
  params?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  progress?: number | null;
  error_message?: string | null;
  created_at: string; // ISO timestamp
  updated_at?: string | null; // ISO timestamp
}

/**
 * Chat message request DTO
 */
export interface ChatMessageRequest {
  session_id?: string;
  message: string;
}

/**
 * Chat message response DTO
 */
export interface ChatMessageResponse {
  session_id: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

/**
 * Session creation response DTO
 */
export interface SessionCreateResponse {
  session_id: string;
  created_at: string; // ISO timestamp
}

/**
 * Session history response
 */
export interface SessionHistoryResponse {
  session_id: string;
  history: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

/**
 * API Error response
 */
export interface ApiErrorResponse {
  detail: string;
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
