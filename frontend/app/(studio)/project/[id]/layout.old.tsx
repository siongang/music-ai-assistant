/**
 * Project Workstation Layout
 *
 * Loads project and tree from API; hydrates object-tree store; saves tree on unmount.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProject, getProjectTree, putProjectTree } from "@/api-client";
import { apiProjectToProject } from "@/adapters/project";
import {
  apiObjectToMusicalObject,
  musicalObjectToApi,
  type ApiTreeObject,
} from "@/adapters/musical-object";
import { useObjectTreeStore } from "@/features/object-tree/store/object-tree-store";
import { useAudioUpload, openFilePicker, DropZone, UploadToast } from "@/features/audio-upload";
import type { Project } from "@/types";

export default function ProjectLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : null;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);
  const [currentUploadFilename, setCurrentUploadFilename] = useState<string | null>(null);
  const hasHydrated = useRef(false);
  
  // Audio upload hook
  const { uploadFile, uploadState } = useAudioUpload(projectId || '');

  const {
    objects,
    rootId,
    clearAll,
    addObject,
    getObject,
    getChildren,
    getRootObjects,
    selectObject,
    clearSelection,
  } = useObjectTreeStore();

  // Load project and tree when projectId changes
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let cancelled = false;

    Promise.all([getProject(projectId), getProjectTree(projectId)])
      .then(([projectDto, tree]) => {
        if (cancelled) return;
        setProject(apiProjectToProject(projectDto));

        // Hydrate object-tree store: add all objects with their parent_id
        clearAll();
        hasHydrated.current = true;
        const objs = tree.objects || {};
        const toApiObj = (o: Record<string, unknown>): ApiTreeObject => ({
          id: String(o.id ?? ""),
          name: String(o.name ?? ""),
          type: String(o.type ?? "audio"),
          parent_id: o.parent_id != null ? String(o.parent_id) : null,
          metadata: (o.metadata && typeof o.metadata === "object" && !Array.isArray(o.metadata)
            ? (o.metadata as Record<string, unknown>)
            : {}),
          created_at: String(o.created_at ?? new Date().toISOString()),
          updated_at: String(o.updated_at ?? new Date().toISOString()),
        });
        
        // Add all objects - each has its own parent_id (null for roots)
        for (const id of Object.keys(objs)) {
          const o = objs[id];
          if (!o || typeof o !== "object" || !("id" in o)) continue;
          const apiObj = toApiObj(o as Record<string, unknown>);
          addObject(apiObjectToMusicalObject(apiObj), apiObj.parent_id);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load project");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, clearAll, addObject]);
  
  // Save tree to backend
  const saveTree = useCallback(async () => {
    if (!projectId) return;
    const state = useObjectTreeStore.getState();
    const snapshot = {
      objects: Object.fromEntries(
        Object.entries(state.objects).map(([id, obj]) => [id, musicalObjectToApi(obj)])
      ),
      root_id: null,
    };
    await putProjectTree(projectId, snapshot);
    useObjectTreeStore.getState().markClean();
  }, [projectId]);

  // Handle "Add Object" button click
  const handleAddObject = async () => {
    if (!projectId) return;
    
    const files = await openFilePicker({ multiple: true });
    
    for (const file of files) {
      try {
        setCurrentUploadFilename(file.name);
        // Each upload is a root object; only tool outputs are children
        await uploadFile(file, null);
      } catch (error) {
        console.error('Upload failed:', error);
        // Error is already in uploadState
      } finally {
        setCurrentUploadFilename(null);
      }
    }
    
    // Save tree immediately after upload
    if (files.length > 0) {
      await saveTree();
    }
  };
  
  // Handle files dropped on object panel
  const handleFilesDropped = async (files: File[]) => {
    if (!projectId) return;
    
    for (const file of files) {
      try {
        setCurrentUploadFilename(file.name);
        // Each upload is a root object; only tool outputs are children
        await uploadFile(file, null);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setCurrentUploadFilename(null);
      }
    }
    
    // Save tree immediately after upload
    if (files.length > 0) {
      await saveTree();
    }
  };

  // Save tree on unmount only if mutated (avoids redundant PUT; future Save button can use isDirty + markClean)
  useEffect(() => {
    return () => {
      if (!projectId || !hasHydrated.current) return;
      const state = useObjectTreeStore.getState();
      if (!state.isDirty) return;
      const snapshot = {
        objects: Object.fromEntries(
          Object.entries(state.objects).map(([id, obj]) => [id, musicalObjectToApi(obj)])
        ),
        root_id: null, // No single root; objects with parent_id=null are roots
      };
      putProjectTree(projectId, snapshot)
        .then(() => useObjectTreeStore.getState().markClean())
        .catch(() => {});
    };
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-zinc-500">
        Invalid project
      </div>
    );
  }

  if (loading && !project) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-zinc-500">
        Loading project…
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-zinc-400">
        <p>{error}</p>
        <Link href="/studio" className="text-cyan-400 hover:text-cyan-300">
          Back to Studio
        </Link>
      </div>
    );
  }

  const displayName = project?.name ?? "Project";
  const tempo = project?.tempo ?? 120;
  const timeSig = project?.timeSignature ?? { numerator: 4, denominator: 4 };
  const keySig = project?.key ?? "C";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/50 bg-black px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="p-1 text-zinc-500 transition-colors hover:text-zinc-300"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/studio" className="flex items-center transition-opacity hover:opacity-70">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white transition-all hover:from-cyan-400 hover:to-blue-500"
          >
            Upgrade
          </button>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-1.5 transition-all"
            onMouseEnter={() => setIsHoveringTitle(true)}
            onMouseLeave={() => setIsHoveringTitle(false)}
            style={{
              outline: isHoveringTitle ? "1px solid rgba(63, 63, 70, 0.5)" : "none",
            }}
          >
            <div className="h-4 w-4" aria-hidden="true" />
            <span className="max-w-md truncate text-sm font-medium text-white">
              {displayName}
            </span>
            <button
              type="button"
              className="h-4 w-4 flex-shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
              style={{ opacity: isHoveringTitle ? 1 : 0 }}
              aria-label="Edit project name"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAddObject}
            disabled={uploadState.isUploading}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-all hover:from-cyan-500/20 hover:to-blue-500/20 disabled:opacity-50"
            title="Upload audio files"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {tempo}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            {timeSig.numerator}/{timeSig.denominator}
          </button>
          <button
            type="button"
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            {keySig}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {isPanelOpen && (
          <aside className="w-56 border-r border-zinc-900 bg-black">
            <DropZone onFilesDropped={handleFilesDropped} className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-zinc-900 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Objects
                </span>
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(false)}
                  className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-900 hover:text-zinc-400"
                  aria-label="Close panel"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="border-b border-zinc-900 p-2">
                <button
                  type="button"
                  onClick={handleAddObject}
                  disabled={uploadState.isUploading}
                  className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-zinc-800 bg-zinc-950 py-2 text-xs font-medium text-zinc-500 transition-all hover:border-cyan-500/30 hover:bg-zinc-900 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadState.isUploading ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

              <div className="flex-1 overflow-auto p-2">
                <ObjectTreePanel
                  objects={objects}
                  getChildren={getChildren}
                  getRootObjects={getRootObjects}
                  selectObject={selectObject}
                  clearSelection={clearSelection}
                  isSelected={(id) => useObjectTreeStore.getState().selectedIds.includes(id)}
                  onAddObjectClick={handleAddObject}
                  isUploading={uploadState.isUploading}
                />
              </div>
              
              {uploadState.error && (
                <div className="border-t border-zinc-900 bg-red-950/20 px-3 py-2">
                  <p className="text-xs text-red-400">{uploadState.error}</p>
                </div>
              )}
            </DropZone>
          </aside>
        )}

        {!isPanelOpen && (
          <button
            type="button"
            onClick={() => setIsPanelOpen(true)}
            className="group flex w-8 items-center justify-center border-r border-zinc-900 bg-black transition-colors hover:bg-zinc-950"
            aria-label="Open panel"
          >
            <svg
              className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <main className="flex-1 bg-black">{children}</main>
      </div>

      <footer className="flex h-16 shrink-0 items-center justify-center bg-black px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
              aria-label="Play"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
              aria-label="Stop"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
              aria-label="Loop"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="font-mono text-lg font-medium text-white">00:00.0</div>
        </div>
      </footer>
      
      <UploadToast uploadState={uploadState} filename={currentUploadFilename || undefined} />
    </div>
  );
}

function ObjectTreePanel({
  objects,
  getChildren,
  getRootObjects,
  selectObject,
  clearSelection,
  isSelected,
  onAddObjectClick,
  isUploading,
}: {
  objects: Record<string, import("@/types").MusicalObject>;
  getChildren: (parentId: string) => import("@/types").MusicalObject[];
  getRootObjects: () => import("@/types").MusicalObject[];
  selectObject: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  onAddObjectClick: () => void;
  isUploading: boolean;
}) {
  // Get all root objects (objects with parentId === null)
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
          getChildren={getChildren}
          selectObject={selectObject}
          isSelected={isSelected}
          level={0}
        />
      ))}
    </div>
  );
}

function TreeNode({
  object,
  getChildren,
  selectObject,
  isSelected,
  level,
}: {
  object: import("@/types").MusicalObject;
  getChildren: (parentId: string) => import("@/types").MusicalObject[];
  selectObject: (id: string, multi?: boolean) => void;
  isSelected: (id: string) => boolean;
  level: number;
}) {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
