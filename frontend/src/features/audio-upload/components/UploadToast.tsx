/**
 * Upload Toast Notification
 * 
 * Shows upload progress and status.
 */

'use client';

import { useEffect, useState } from 'react';
import type { UploadState } from '../hooks/useAudioUpload';

export interface UploadToastProps {
  uploadState: UploadState;
  filename?: string;
}

/**
 * Toast notification for upload status
 * 
 * Automatically hides after success/error.
 * 
 * @example
 * ```tsx
 * <UploadToast uploadState={uploadState} filename="song.mp3" />
 * ```
 */
export function UploadToast({ uploadState, filename }: UploadToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (uploadState.isUploading) {
      setVisible(true);
    } else if (uploadState.error) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    } else if (uploadState.progress === 1) {
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploadState]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 min-w-80 max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
      {uploadState.isUploading && (
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 animate-spin text-cyan-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Uploading...</p>
            {filename && (
              <p className="mt-1 text-xs text-zinc-400">{filename}</p>
            )}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${uploadState.progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {uploadState.error && (
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Upload failed</p>
            <p className="mt-1 text-xs text-red-400">{uploadState.error}</p>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {!uploadState.isUploading && !uploadState.error && uploadState.progress === 1 && (
        <div className="flex items-start gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Upload complete</p>
            {filename && (
              <p className="mt-1 text-xs text-zinc-400">{filename}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
