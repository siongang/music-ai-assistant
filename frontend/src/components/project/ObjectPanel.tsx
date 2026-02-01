/**
 * Object Panel Component
 * 
 * Sidebar with object tree and upload controls
 */

'use client';

import type { MusicalObject } from '@/types';
import { DropZone } from '@/features/audio-upload';
import { ObjectTreeView } from './ObjectTree';

export interface ObjectPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddObject: () => void;
  onFilesDropped: (files: File[]) => void;
  rootObjects: MusicalObject[];
  selectedIds: string[];
  onSelect: (id: string, multi?: boolean) => void;
  getChildren: (parentId: string) => MusicalObject[];
  isUploading: boolean;
  uploadError: string | null;
}

export function ObjectPanel({
  isOpen,
  onClose,
  onAddObject,
  onFilesDropped,
  rootObjects,
  selectedIds,
  onSelect,
  getChildren,
  isUploading,
  uploadError,
}: ObjectPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-56 border-r border-zinc-900 bg-black">
      <DropZone onFilesDropped={onFilesDropped} className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Objects
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-zinc-400"
            aria-label="Close panel"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Add Object Button */}
        <div className="border-b border-zinc-900 p-2">
          <button
            type="button"
            onClick={onAddObject}
            disabled={isUploading}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-zinc-800 bg-zinc-950 py-2 text-xs font-medium text-zinc-500 transition-all hover:border-cyan-500/30 hover:bg-zinc-900 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                Uploading...
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Object
              </>
            )}
          </button>
        </div>

        {/* Object Tree */}
        <div className="flex-1 overflow-auto p-2">
          <ObjectTreeView
            rootObjects={rootObjects}
            selectedIds={selectedIds}
            onSelect={onSelect}
            getChildren={getChildren}
            onAddObjectClick={onAddObject}
            isUploading={isUploading}
          />
        </div>

        {/* Error Display */}
        {uploadError && (
          <div className="border-t border-zinc-900 bg-red-950/20 px-3 py-2">
            <p className="text-xs text-red-400">{uploadError}</p>
          </div>
        )}
      </DropZone>
    </aside>
  );
}
