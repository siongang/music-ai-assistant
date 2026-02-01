/**
 * Audio API Endpoints
 *
 * All audio is project-scoped: POST/GET/list/download under /projects/{project_id}/audio.
 */

import { apiClient } from '../client';
import type { AudioUploadResponse, AudioMetadata, ProjectAudioMetadata } from '../types';

/**
 * List audio for a project (newest first)
 *
 * GET /projects/{project_id}/audio?limit=...&offset=...
 */
export async function listProjectAudio(
  projectId: string,
  options?: { limit?: number; offset?: number }
): Promise<ProjectAudioMetadata[]> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) params.append('limit', String(options.limit));
  if (options?.offset !== undefined) params.append('offset', String(options.offset));
  const query = params.toString();
  const endpoint = query
    ? `/projects/${projectId}/audio?${query}`
    : `/projects/${projectId}/audio`;
  return apiClient.get<ProjectAudioMetadata[]>(endpoint);
}

/**
 * Upload an audio file to a project
 *
 * POST /projects/{project_id}/audio (multipart: file)
 */
export async function uploadProjectAudio(
  projectId: string,
  file: File
): Promise<AudioUploadResponse> {
  return apiClient.uploadFile<AudioUploadResponse>(`/projects/${projectId}/audio`, file);
}

/**
 * Get audio metadata for an item in a project
 *
 * GET /projects/{project_id}/audio/{audio_id}
 */
export async function getProjectAudio(
  projectId: string,
  audioId: string
): Promise<ProjectAudioMetadata> {
  return apiClient.get<ProjectAudioMetadata>(`/projects/${projectId}/audio/${audioId}`);
}

/**
 * Download an audio file from a project
 *
 * GET /projects/{project_id}/audio/{audio_id}/download
 */
export async function downloadProjectAudio(
  projectId: string,
  audioId: string
): Promise<Blob> {
  return apiClient.downloadFile(`/projects/${projectId}/audio/${audioId}/download`);
}

/**
 * Download any file from storage by its relative path (e.g. job outputs)
 *
 * GET /audio/files/{file_path}
 */
export async function downloadFile(filePath: string): Promise<Blob> {
  return apiClient.downloadFile(`/audio/files/${filePath}`);
}

/**
 * Get audio metadata (for future use)
 *
 * Note: Prefer getProjectAudio(projectId, audioId) for project-scoped audio.
 */
export async function getAudioMetadata(audioId: string): Promise<AudioMetadata> {
  return apiClient.get<AudioMetadata>(`/audio/${audioId}`);
}
