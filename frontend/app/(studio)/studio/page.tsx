/**
 * Studio Home Page
 * 
 * Main studio landing with upload and recent projects.
 */

import Link from "next/link";

export default function StudioPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="mb-3 text-3xl font-bold text-white">
            Welcome to Music Assistant
          </h1>
          <p className="text-lg text-zinc-400">
            Your AI-powered music workstation. Upload audio, separate stems, 
            and transform your creative workflow.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <button className="group relative flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-12 transition-all hover:border-cyan-500/50 hover:bg-zinc-900/80">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 transition-all group-hover:scale-110">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="mb-1 text-lg font-semibold text-white">
                  Upload Audio File
                </p>
                <p className="text-sm text-zinc-400">
                  Drag and drop or click to browse • MP3, WAV, FLAC supported
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Projects Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
            <Link
              href="/studio/projects"
              className="text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
            >
              View All →
            </Link>
          </div>

          {/* Empty State - with demo link */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
                <svg className="h-8 w-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-300">
                No projects yet
              </h3>
              <p className="mb-6 max-w-md text-sm text-zinc-500">
                Upload your first audio file to create a project and start working with AI-powered tools.
              </p>
              <div className="flex gap-3">
                <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/40">
                  Create Project
                </button>
                <Link
                  href="/project/demo"
                  className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:border-zinc-600 hover:bg-zinc-700/50"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </div>

          {/* Example of what recent projects would look like (commented out for now) */}
          {/* <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/studio/project/1"
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-cyan-500/30 hover:bg-zinc-900/80"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <svg className="h-6 w-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <span className="text-xs text-zinc-500">2 days ago</span>
              </div>
              <h3 className="mb-1 font-semibold text-white">My Song Project</h3>
              <p className="text-sm text-zinc-400">4 objects • 3:45 duration</p>
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  );
}
