/**
 * Project Workstation Layout
 *
 * Orchestrates project components with data from backend
 */

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useObjectTreeStore } from "@/features/object-tree/store/object-tree-store";
import { useAudioUpload, openFilePicker, UploadToast } from "@/features/audio-upload";
import { ProjectHeader, ObjectPanel, TransportBar } from "@/components/project";
import { useProjectData } from "@/hooks/useProjectData";

export default function ProjectLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : null;
  
  // State
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [currentUploadFilename, setCurrentUploadFilename] = useState<string | null>(null);

  // Data hooks
  const { project, loading, error, saveTree } = useProjectData(projectId);
  const { uploadFile, uploadState } = useAudioUpload(projectId || '');
  
  // Store
  const {
    getRootObjects,
    getChildren,
    selectObject,
    clearSelection,
    selectedIds,
  } = useObjectTreeStore();

  // Handlers
  const handleAddObject = async () => {
    if (!projectId) return;
    
    const files = await openFilePicker({ multiple: true });
    
    for (const file of files) {
      try {
        setCurrentUploadFilename(file.name);
        await uploadFile(file, null);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setCurrentUploadFilename(null);
      }
    }
    
    if (files.length > 0) {
      await saveTree();
    }
  };

  const handleFilesDropped = async (files: File[]) => {
    if (!projectId) return;
    
    for (const file of files) {
      try {
        setCurrentUploadFilename(file.name);
        await uploadFile(file, null);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setCurrentUploadFilename(null);
      }
    }
    
    if (files.length > 0) {
      await saveTree();
    }
  };

  // Loading and error states
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
  const rootObjects = getRootObjects();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black">
      {/* Header */}
      <ProjectHeader
        projectName={displayName}
        tempo={tempo}
        timeSignature={timeSig}
        keySignature={keySig}
        onUpload={handleAddObject}
        isUploading={uploadState.isUploading}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Object Panel (Sidebar) */}
        {isPanelOpen && (
          <ObjectPanel
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            onAddObject={handleAddObject}
            onFilesDropped={handleFilesDropped}
            rootObjects={rootObjects}
            selectedIds={selectedIds}
            onSelect={selectObject}
            getChildren={getChildren}
            isUploading={uploadState.isUploading}
            uploadError={uploadState.error}
          />
        )}

        {/* Panel toggle button (when closed) */}
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

        {/* Main content (track area, etc.) */}
        <main className="flex-1 bg-black">{children}</main>
      </div>

      {/* Transport Bar */}
      <TransportBar />

      {/* Upload Toast */}
      <UploadToast uploadState={uploadState} filename={currentUploadFilename || undefined} />
    </div>
  );
}
