/**
 * Project Header Component
 * 
 * Top navigation bar with logo, project name, settings, and upload button
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface ProjectHeaderProps {
  projectName: string;
  tempo: number;
  timeSignature: { numerator: number; denominator: number };
  keySignature: string;
  onUpload: () => void;
  isUploading?: boolean;
}

export function ProjectHeader({
  projectName,
  tempo,
  timeSignature,
  keySignature,
  onUpload,
  isUploading = false,
}: ProjectHeaderProps) {
  const [isHoveringTitle, setIsHoveringTitle] = useState(false);

  return (
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
            outline: isHoveringTitle ? '1px solid rgba(63, 63, 70, 0.5)' : 'none',
          }}
        >
          <div className="h-4 w-4" aria-hidden="true" />
          <span className="max-w-md truncate text-sm font-medium text-white">
            {projectName}
          </span>
          <button
            type="button"
            className="h-4 w-4 flex-shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
            style={{ opacity: isHoveringTitle ? 1 : 0 }}
            aria-label="Edit project name"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onUpload}
          disabled={isUploading}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-all hover:from-cyan-500/20 hover:to-blue-500/20 disabled:opacity-50"
          title="Upload audio files"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Upload
        </button>
        <div className="h-4 w-px bg-zinc-800" />
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {tempo}
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
          {timeSignature.numerator}/{timeSignature.denominator}
        </button>
        <button
          type="button"
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
        >
          {keySignature}
        </button>
      </div>
    </header>
  );
}
