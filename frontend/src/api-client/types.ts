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
  project_id?: string;
  duration?: number;
  sample_rate?: number;
  channels?: number;
  format?: string;
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
 * Project audio list item (matches backend AudioMetadataResponse)
 */
export interface ProjectAudioMetadata {
  audio_id: string;
  filename: string;
  file_path: string;
  project_id: string;
  duration?: number;
  sample_rate?: number;
  channels?: number;
  format?: string;
  created_at: string;
  updated_at?: string | null;
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
 * Audio session types (matches backend audio session schemas)
 */
export interface AudioSessionListItem {
  id: string;
}

export interface AudioSessionClipResponse {
  id: string;
  assetId: string;
  start: number;
  in: number;
  duration: number;
  playbackRate?: number;
}

export interface AudioSessionTrackResponse {
  id: string;
  name: string;
  gain: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  clips: AudioSessionClipResponse[];
}

export interface AudioSessionResponse {
  id: string;
  tracks: AudioSessionTrackResponse[];
  master_gain: number;
}

/**
 * Project tree snapshot (matches backend TreeSnapshot)
 */
export interface TreeSnapshotDTO {
  objects: Record<string, Record<string, unknown>>;
  root_id: string | null;
}

/**
 * Project response DTO (matches backend ProjectResponse)
 */
export interface ProjectDTO {
  id: string;
  name: string;
  tempo: number;
  key: string;
  time_signature: { numerator: number; denominator: number };
  description?: string | null;
  thumbnail?: string | null;
  root_object_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Project list item DTO (matches backend ProjectListItem)
 */
export interface ProjectListItemDTO {
  id: string;
  name: string;
  thumbnail?: string | null;
  updated_at: string;
  created_at: string;
}

/**
 * Create project request (matches backend ProjectCreate)
 */
export interface CreateProjectRequest {
  name: string;
  tempo?: number;
  key?: string;
  time_signature?: { numerator: number; denominator: number };
  description?: string | null;
}

/**
 * Update project request (matches backend ProjectUpdate)
 */
export interface UpdateProjectRequest {
  name?: string;
  tempo?: number;
  key?: string;
  time_signature?: { numerator: number; denominator: number };
  description?: string | null;
  thumbnail?: string | null;
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
