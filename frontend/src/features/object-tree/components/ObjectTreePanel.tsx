/**
 * Object Tree Panel
 *
 * Sidebar panel listing all MusicalObjects as a collapsible tree.
 * Roots are objects with parentId === null; children are nested below.
 */

"use client";

import { useState } from "react";
import type { MusicalObject } from "@/types";

export interface ObjectTreePanelProps {
  objects: Record<string, MusicalObject>;
  getChildren: (parentId: string) => MusicalObject[];
  getRootObjects: () => MusicalObject[];
  selectObject: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  onAddObjectClick: () => void;
  isUploading: boolean;
}

export function ObjectTreePanel({
  getChildren,
  getRootObjects,
  selectObject,
  isSelected,
  onAddObjectClick,
  isUploading,
}: ObjectTreePanelProps) {
  const rootObjects = getRootObjects();

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
          {isUploading ? "Uploading..." : "Drop files here or click to add"}
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
          getChildren={getChildren}
          selectObject={selectObject}
          isSelected={isSelected}
          level={0}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  object: MusicalObject;
  getChildren: (parentId: string) => MusicalObject[];
  selectObject: (id: string, multi?: boolean) => void;
  isSelected: (id: string) => boolean;
  level: number;
}

function TreeNode({
  object,
  getChildren,
  selectObject,
  isSelected,
  level,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const children = getChildren(object.id);
  const hasChildren = children.length > 0;

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors hover:bg-zinc-900"
        style={{ paddingLeft: `${level * 8 + 4}px` }}
      >
        <button
          type="button"
          className="flex h-4 w-4 items-center justify-center text-zinc-500 hover:text-zinc-400"
          onClick={() => hasChildren && setExpanded((e) => !e)}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          ) : (
            <span className="w-3.5" />
          )}
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left"
          onClick={() => selectObject(object.id)}
        >
          <span className={isSelected(object.id) ? "text-cyan-400" : "text-zinc-300"}>
            {object.name}
          </span>
        </button>
      </div>
      {hasChildren && expanded && (
        <div className="mt-0.5">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              object={child}
              getChildren={getChildren}
              selectObject={selectObject}
              isSelected={isSelected}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
