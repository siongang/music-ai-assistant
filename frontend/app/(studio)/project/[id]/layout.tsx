/**
 * Project Workstation Layout
 *
 * Loads project and tree from API; hydrates object-tree store; saves tree on unmount.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProject, getProjectTree, putProjectTree, updateProject } from "@/api-client";
import { apiProjectToProject } from "@/adapters/project";
import {
  apiObjectToMusicalObject,
  musicalObjectToApi,
  type ApiTreeObject,
} from "@/adapters/musical-object";
import { useObjectTreeStore } from "@/features/object-tree/store/object-tree-store";
import { ObjectTreePanel } from "@/features/object-tree/components/ObjectTreePanel";
import { useAudioUpload, openFilePicker, DropZone, UploadToast } from "@/features/audio-upload";
import { TransportBar } from "@/features/transport/components/TransportBar";
import type { Project } from "@/types";

function toApiObj(o: Record<string, unknown>): ApiTreeObject {
  return {
    id: String(o.id ?? ""),
    name: String(o.name ?? ""),
    type: String(o.type ?? "audio"),
    parent_id: o.parent_id != null ? String(o.parent_id) : null,
    metadata:
      o.metadata && typeof o.metadata === "object" && !Array.isArray(o.metadata)
        ? (o.metadata as Record<string, unknown>)
        : {},
    created_at: String(o.created_at ?? new Date().toISOString()),
    updated_at: String(o.updated_at ?? new Date().toISOString()),
  };
}

export default function ProjectLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : null;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [currentUploadFilename, setCurrentUploadFilename] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const hasHydrated = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const skipTitleBlurCommitRef = useRef(false);
  
  // Audio upload hook
  const { uploadFile, uploadState } = useAudioUpload(projectId || '');

  const {
    objects,
    clearAll,
    addObject,
    getChildren,
    getRootObjects,
    selectObject,
    clearSelection,
  } = useObjectTreeStore();

  const selectedIds = useObjectTreeStore((s) => s.selectedIds);

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
        const nextProject = apiProjectToProject(projectDto);
        setProject(nextProject);
        setTitleDraft(nextProject.name);

        // Hydrate object-tree store: add all objects with their parent_id
        clearAll();
        hasHydrated.current = true;
        const objs = tree.objects || {};
        
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
  
  // Shared upload handler — each file becomes a root object (parentId = null)
  const uploadFiles = async (files: File[]) => {
    if (!projectId) return;
    for (const file of files) {
      try {
        setCurrentUploadFilename(file.name);
        await uploadFile(file, null);
      } catch (error) {
        console.error("Upload failed:", error);
        // Error surface is already captured in uploadState
      } finally {
        setCurrentUploadFilename(null);
      }
    }
  };

  const handleAddObject = async () => {
    const files = await openFilePicker({ multiple: true });
    await uploadFiles(files);
  };

  const handleFilesDropped = (files: File[]) => { void uploadFiles(files); };

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

  const displayName = project?.name ?? "Project";
  const tempo = project?.tempo ?? 120;
  const timeSig = project?.timeSignature ?? { numerator: 4, denominator: 4 };
  const keySig = project?.key ?? "C";

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const commitTitleChange = async () => {
    if (!projectId || !project) return;

    const nextName = titleDraft.trim();
    if (!nextName) {
      setTitleDraft(project.name);
      setTitleError(null);
      setIsEditingTitle(false);
      return;
    }

    if (nextName === project.name) {
      setTitleError(null);
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    setTitleError(null);

    try {
      const updated = await updateProject(projectId, { name: nextName });
      const nextProject = apiProjectToProject(updated);
      setProject(nextProject);
      setTitleDraft(nextProject.name);
      setIsEditingTitle(false);
    } catch (titleUpdateError) {
      setTitleError(titleUpdateError instanceof Error ? titleUpdateError.message : "Failed to save title");
    } finally {
      setIsSavingTitle(false);
    }
  };

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
          <div className="flex items-center gap-3 rounded-lg border border-transparent px-4 py-1.5">
            <div className="h-4 w-4" aria-hidden="true" />
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onBlur={() => {
                    if (skipTitleBlurCommitRef.current) {
                      skipTitleBlurCommitRef.current = false;
                      return;
                    }
                    void commitTitleChange();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void commitTitleChange();
                    }
                    if (event.key === "Escape") {
                      skipTitleBlurCommitRef.current = true;
                      setTitleDraft(displayName);
                      setTitleError(null);
                      setIsEditingTitle(false);
                    }
                  }}
                  disabled={isSavingTitle}
                  className="w-72 rounded bg-zinc-950 px-2 py-1 text-sm font-medium text-white outline-none ring-1 ring-zinc-800 focus:ring-cyan-500/40"
                  aria-label="Project name"
                />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(displayName);
                    setTitleError(null);
                    setIsEditingTitle(true);
                  }}
                  className="max-w-md truncate text-left text-sm font-medium text-white transition-colors hover:text-zinc-100"
                  aria-label="Edit project name"
                >
                  {displayName}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(displayName);
                    setTitleError(null);
                    setIsEditingTitle(true);
                  }}
                  className="h-4 w-4 flex-shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
                  aria-label="Edit project name"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </>
            )}
          </div>
          {titleError && (
            <p className="mt-1 text-center text-xs text-red-400">{titleError}</p>
          )}
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

      {/* Main content area: min-h-0 so flex child can shrink below content height */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
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
                  isSelected={(id) => selectedIds.includes(id)}
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

        {/* Main content (track area, etc.): flex column so children get bounded height */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">{children}</main>
      </div>

      <TransportBar />
      
      <UploadToast uploadState={uploadState} filename={currentUploadFilename || undefined} />
    </div>
  );
}
