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
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
        setUploadState({
          isUploading: false,
          progress: 0,
          error: 'Invalid file type. Please upload MP3 or WAV files.',
        });
        return;
      }

      // Start upload
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
      });

      try {
        // Upload to API
        const response = await uploadProjectAudio(projectId, file);
        
        // Update progress
        setUploadState((prev) => ({ ...prev, progress: 0.8 }));
        
        // Convert to MusicalObject
        const audioObject = audioUploadToObject(response.audio_id, response.filename);
        
        // Add to object tree
        addObject(audioObject, parentId);
        
        // Complete
        setUploadState({
          isUploading: false,
          progress: 1,
          error: null,
        });
      } catch (error) {
        setUploadState({
          isUploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
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
