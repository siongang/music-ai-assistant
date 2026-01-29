/**
 * Audio API Endpoints
 * 
 * Typed functions for audio-related API calls.
 */

import { apiClient } from '../client';
import { AudioUploadResponse, AudioMetadata } from '../types';

/**
 * Upload an audio file
 * 
 * POST /audio
 * 
 * @param file - Audio file to upload
 * @returns AudioUploadResponse with audio_id and filename
 */
export async function uploadAudio(file: File): Promise<AudioUploadResponse> {
  return apiClient.uploadFile<AudioUploadResponse>('/audio', file);
}

/**
 * Download an audio file by its audio_id
 * 
 * GET /audio/{audio_id}/download
 * 
 * @param audioId - UUID of the audio to download
 * @returns Blob containing the audio file
 */
export async function downloadAudio(audioId: string): Promise<Blob> {
  return apiClient.downloadFile(`/audio/${audioId}/download`);
}

/**
 * Download any file from storage by its relative path
 * 
 * GET /audio/files/{file_path}
 * 
 * This is used for downloading job outputs (stems, MIDI, etc.)
 * 
 * @param filePath - Relative path to file (e.g., "jobs/xxx/stems/vocals.mp3")
 * @returns Blob containing the file
 * 
 * @example
 * ```ts
 * const blob = await downloadFile('jobs/abc-123/stems/track.vocals.mp3');
 * ```
 */
export async function downloadFile(filePath: string): Promise<Blob> {
  return apiClient.downloadFile(`/audio/files/${filePath}`);
}

/**
 * Get audio metadata (for future use)
 * 
 * Note: This endpoint is not yet implemented in the backend.
 * This is a placeholder for future functionality.
 * 
 * @param audioId - UUID of the audio
 * @returns Audio metadata
 */
export async function getAudioMetadata(audioId: string): Promise<AudioMetadata> {
  // TODO: Implement this endpoint in the backend
  return apiClient.get<AudioMetadata>(`/audio/${audioId}`);
}
