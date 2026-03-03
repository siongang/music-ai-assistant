/**
 * Drop Zone Component
 * 
 * Drag & drop area for audio file uploads.
 */

'use client';

import { useCallback, useState, type DragEvent, type ReactNode } from 'react';
import { isAudioFile } from '../utils/file-picker';

export interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  showOverlay?: boolean;
}

/**
 * Drop zone for drag & drop file uploads
 * 
 * Wraps children with drag & drop handlers.
 * Shows visual feedback during drag operations.
 * 
 * @example
 * ```tsx
 * <DropZone onFilesDropped={handleFiles}>
 *   <div>Drop audio files here</div>
 * </DropZone>
 * ```
 */
export function DropZone({
  onFilesDropped,
  children,
  className = '',
  disabled = false,
  showOverlay = true,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) return;
      
      // Only activate drop zone for actual file uploads from file system
      // Internal drags (audio objects) will have 'application/json' type
      // File uploads will have 'Files' type
      const hasFiles = e.dataTransfer.types.includes('Files');
      
      if (!hasFiles) {
        // This is an internal drag (audio object), not a file upload
        return;
      }
      
      setDragCounter((prev) => prev + 1);
      
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) return;
      
      setDragCounter((prev) => {
        const newCounter = prev - 1;
        if (newCounter === 0) {
          setIsDragging(false);
        }
        return newCounter;
      });
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Only respond to file uploads, not internal drags
      const hasFiles = e.dataTransfer.types.includes('Files');
      if (hasFiles) {
        e.dataTransfer.dropEffect = 'copy';
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (disabled) return;
      
      setIsDragging(false);
      setDragCounter(0);
      
      // Only handle actual file drops, not internal drags
      const hasFiles = e.dataTransfer.types.includes('Files');
      if (!hasFiles) {
        return;
      }
      
      const files = Array.from(e.dataTransfer.files).filter(isAudioFile);
      
      if (files.length > 0) {
        onFilesDropped(files);
      }
    },
    [disabled, onFilesDropped]
  );

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative ${className}`}
    >
      {children}
      
      {showOverlay && isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-cyan-500 bg-cyan-500/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/30">
              <svg
                className="h-8 w-8 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-cyan-400">
              Drop audio files to upload
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
