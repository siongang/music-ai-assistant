/**
 * Tree Node Component
 * 
 * Individual node in the object tree with expand/collapse
 */

'use client';

import { useState } from 'react';
import type { MusicalObject } from '@/types';

export interface TreeNodeProps {
  object: MusicalObject;
  isSelected: boolean;
  onSelect: (id: string, multi?: boolean) => void;
  getChildren: (parentId: string) => MusicalObject[];
  depth?: number;
}

export function TreeNode({
  object,
  isSelected,
  onSelect,
  getChildren,
  depth = 0,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const children = getChildren(object.id);
  const hasChildren = children.length > 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return '🎵';
      case 'midi':
        return '🎹';
      case 'stems':
        return '🎛️';
      default:
        return '📄';
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(object.id)}
        className={`group flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors ${
          isSelected
            ? 'bg-cyan-500/20 text-cyan-400'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex h-3 w-3 items-center justify-center text-zinc-600 hover:text-zinc-400"
          >
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span className="w-3" />}
        <span className="flex-1 truncate">{object.name}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              object={child}
              isSelected={isSelected}
              onSelect={onSelect}
              getChildren={getChildren}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
