/**
 * Object Tree View Component
 * 
 * Displays hierarchical object tree
 */

'use client';

import type { MusicalObject } from '@/types';
import { TreeNode } from './TreeNode';

export interface ObjectTreeViewProps {
  rootObjects: MusicalObject[];
  selectedIds: string[];
  onSelect: (id: string, multi?: boolean) => void;
  getChildren: (parentId: string) => MusicalObject[];
  onAddObjectClick: () => void;
  isUploading: boolean;
}

export function ObjectTreeView({
  rootObjects,
  selectedIds,
  onSelect,
  getChildren,
  onAddObjectClick,
  isUploading,
}: ObjectTreeViewProps) {
  if (rootObjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="mb-2 h-8 w-8 text-zinc-800"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p className="text-[10px] text-zinc-600">No objects yet</p>
        <button
          type="button"
          onClick={onAddObjectClick}
          disabled={isUploading}
          className="mt-1 text-[10px] text-cyan-500 hover:text-cyan-400 disabled:opacity-50"
        >
          {isUploading ? 'Uploading...' : 'Drop files here or click to add'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {rootObjects.map((obj) => (
        <TreeNode
          key={obj.id}
          object={obj}
          isSelected={selectedIds.includes(obj.id)}
          onSelect={onSelect}
          getChildren={getChildren}
        />
      ))}
    </div>
  );
}
