/**
 * Audio Upload Hook
 * 
 * Handles the complete upload workflow:
 * File → API → Adapter → Object Tree Store
 */

import { useState, useCallback } from 'react';
import { uploadProjectAudio } from '@/api-client/endpoints/audio';
import { audioUploadToObject } from '@/adapters/musical-object';
import { useObjectTreeStore } from '@/features/object-tree/store/object-tree-store';

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export interface UseAudioUploadReturn {
  uploadState: UploadState;
  uploadFile: (file: File, parentId?: string | null) => Promise<void>;
  resetUpload: () => void;
}

/**
 * Hook for uploading audio files to a project
 * 
 * @param projectId - Project ID to upload to
 * @returns Upload state and upload function
 * 
 * @example
 * ```tsx
 * const { uploadFile, uploadState } = useAudioUpload(projectId);
 * 
 * const handleFileSelect = async (file: File) => {
 *   await uploadFile(file);
 * };
 * ```
 */
export function useAudioUpload(projectId: string): UseAudioUploadReturn {
  const addObject = useObjectTreeStore((state) => state.addObject);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadFile = useCallback(
    async (file: File, parentId: string | null = null) => {
      // Matches backend AUDIO_EXTENSIONS constant — keep in sync if backend changes
      const validExtensions = /\.(mp3|wav|flac|m4a|ogg|wma|aac|aiff)$/i;
      const validMimeTypes = [
        'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac',
        'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a',
        'audio/aiff', 'audio/x-aiff', 'audio/x-ms-wma',
      ];
      const typeValid = validMimeTypes.includes(file.type) || validExtensions.test(file.name);
      if (!typeValid) {
        setUploadState({
          isUploading: false,
          progress: 0,
          error: 'Unsupported file type. Supported: MP3, WAV, FLAC, M4A, OGG, AAC, AIFF, WMA.',
        });
        return;
      }

      setUploadState({ isUploading: true, progress: 0, error: null });

      try {
        const response = await uploadProjectAudio(projectId, file);
        
        const audioObject = audioUploadToObject(response.audio_id, response.filename, {
          duration: response.duration,
          sampleRate: response.sample_rate,
          channels: response.channels,
          format: response.format,
        });
        
        addObject(audioObject, parentId);
        
        setUploadState({ isUploading: false, progress: 1, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        setUploadState({ isUploading: false, progress: 0, error: message });
        // Re-throw so callers (e.g. layout.tsx) can log or react
        throw error;
      }
    },
    [projectId, addObject]
  );

  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
    });
  }, []);

  return {
    uploadState,
    uploadFile,
    resetUpload,
  };
}
