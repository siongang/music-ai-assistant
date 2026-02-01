/**
 * Studio Home Page
 *
 * Project list from API; create project → navigate to /project/[id].
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listProjects, createProject, putProjectTree } from "@/api-client";
import { uploadProjectAudio } from "@/api-client/endpoints/audio";
import { apiProjectListItemToProjectListItem } from "@/adapters/project";
import { audioUploadToObject, musicalObjectToApi } from "@/adapters/musical-object";
import { openFilePicker, DropZone } from "@/features/audio-upload";
import type { ProjectListItem, MusicalObject } from "@/types";

export default function StudioPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProjects({ limit: 50, offset: 0 })
      .then((dtos) => {
        if (!cancelled) {
          setProjects(dtos.map(apiProjectListItemToProjectListItem));
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load projects");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateProject = async () => {
    setCreating(true);
    setError(null);
    try {
      const created = await createProject({ name: "New Project" });
      router.push(`/project/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleUploadAudio = async () => {
    setError(null);
    const files = await openFilePicker({ multiple: true });
    
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      // Create project with first file's name
      const firstFileName = files[0].name.replace(/\.[^/.]+$/, ''); // Remove extension
      setUploadProgress(`Creating project "${firstFileName}"...`);
      
      const created = await createProject({ name: firstFileName });
      
      // Upload all files to the project and build tree
      const audioObjects: MusicalObject[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);
        const response = await uploadProjectAudio(created.id, file);
        
        // Convert to AudioObject for tree
        const audioObj = audioUploadToObject(response.audio_id, response.filename);
        audioObjects.push(audioObj);
      }
      
      // Save tree to backend
      setUploadProgress('Saving project...');
      const treeSnapshot = {
        objects: Object.fromEntries(
          audioObjects.map((obj) => [obj.id, musicalObjectToApi(obj)])
        ),
        root_id: null, // Multiple roots
      };
      await putProjectTree(created.id, treeSnapshot);
      
      // Navigate to project
      router.push(`/project/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload audio");
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFilesDropped = async (files: File[]) => {
    if (files.length === 0) return;
    
    setError(null);
    setUploading(true);
    try {
      // Create project with first file's name
      const firstFileName = files[0].name.replace(/\.[^/.]+$/, '');
      setUploadProgress(`Creating project "${firstFileName}"...`);
      
      const created = await createProject({ name: firstFileName });
      
      // Upload all files and build tree
      const audioObjects: MusicalObject[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);
        const response = await uploadProjectAudio(created.id, file);
        
        // Convert to AudioObject for tree
        const audioObj = audioUploadToObject(response.audio_id, response.filename);
        audioObjects.push(audioObj);
      }
      
      // Save tree to backend
      setUploadProgress('Saving project...');
      const treeSnapshot = {
        objects: Object.fromEntries(
          audioObjects.map((obj) => [obj.id, musicalObjectToApi(obj)])
        ),
        root_id: null, // Multiple roots
      };
      await putProjectTree(created.id, treeSnapshot);
      
      // Navigate to project
      router.push(`/project/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload audio");
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <h1 className="mb-3 text-3xl font-bold text-white">
            Welcome to Music Assistant
          </h1>
          <p className="text-lg text-zinc-400">
            Your AI-powered music workstation. Upload audio, separate stems, and
            transform your creative workflow.
          </p>
        </div>

        <div className="mb-12">
          <DropZone onFilesDropped={handleFilesDropped} disabled={uploading}>
            <button
              type="button"
              onClick={handleUploadAudio}
              disabled={uploading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950 p-12 transition-all hover:border-cyan-500/50 hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 transition-all group-hover:scale-110">
                  {uploading ? (
                    <svg
                      className="h-8 w-8 animate-spin"
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
                  ) : (
                    <svg
                      className="h-8 w-8"
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
                  )}
                </div>
                <div className="text-center">
                  <p className="mb-1 text-lg font-semibold text-white">
                    {uploading ? uploadProgress : "Upload Audio File"}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {uploading
                      ? "Creating project and uploading..."
                      : "Drop files here or click to browse • Creates project automatically"}
                  </p>
                </div>
              </div>
            </button>
          </DropZone>
        </div>

        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-12 text-center text-zinc-500">
              Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-12">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
                  <svg
                    className="h-8 w-8 text-zinc-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-300">
                  No projects yet
                </h3>
                <p className="mb-6 max-w-md text-sm text-zinc-500">
                  Create your first project to start working with audio and
                  AI-powered tools.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    disabled={creating}
                    className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                  >
                    {creating ? "Creating…" : "Create Project"}
                  </button>
                  <Link
                    href="/project/demo"
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:border-zinc-700 hover:bg-zinc-800"
                  >
                    View Demo
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-cyan-500/30 hover:bg-zinc-900/80"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                      <svg
                        className="h-6 w-6 text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatRelativeTime(project.updatedAt)}
                    </span>
                  </div>
                  <h3 className="mb-1 font-semibold text-white">
                    {project.name}
                  </h3>
                  <p className="text-sm text-zinc-400">Open project</p>
                </Link>
              ))}
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={creating}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 p-6 text-zinc-500 transition-all hover:border-cyan-500/30 hover:bg-zinc-900/50 hover:text-cyan-400 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {creating ? "Creating…" : "New Project"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
