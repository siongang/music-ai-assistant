/**
 * Project Workstation Layout
 * 
 * Full-screen DAW interface with modular components
 */

export default function ProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950">
      {/* Top Header Bar */}
      <header className="flex h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-6">
        {/* Left: Menu + Logo + Upgrade + Project Name */}
        <div className="flex items-center gap-4">
          <button 
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-50"
            aria-label="Menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <a href="/studio" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          </a>

          <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-xl hover:shadow-cyan-500/40">
            Upgrade
          </button>

          <div className="ml-2 flex items-center gap-2">
            <span className="text-sm font-medium text-white">New Project</span>
            <button 
              className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-300"
              aria-label="Edit project name"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right side intentionally left empty for future use */}
        <div className="flex items-center gap-3">
          {/* Placeholder for future controls like Save, Publish, etc. */}
        </div>
      </header>

      {/* Transport Bar */}
      <div className="flex h-12 items-center justify-center border-b border-zinc-800/80 bg-zinc-900/50 px-6">
        {/* Left Spacer */}
        <div className="flex-1"></div>

        {/* Center: Playback Controls + Time */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-white"
              aria-label="Play"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button 
              className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-white"
              aria-label="Stop"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
            <button 
              className="rounded-lg p-2 text-zinc-400 transition-all hover:bg-zinc-800/50 hover:text-white"
              aria-label="Loop"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="font-mono text-sm font-medium text-white">00:00.0</div>
        </div>

        {/* Right: BPM, Time Sig, Key */}
        <div className="flex flex-1 items-center justify-end gap-3">
          <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            120
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            4/4
          </button>
          <button className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-white">
            Am
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Objects Panel */}
        <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950">
          <div className="flex h-full flex-col">
            {/* Add Object Button */}
            <div className="border-b border-zinc-800/80 p-3">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:border-cyan-500/50 hover:bg-zinc-900/80 hover:text-cyan-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Object
              </button>
            </div>

            {/* Objects List */}
            <div className="flex-1 overflow-auto p-3">
              {/* Empty State */}
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg className="mb-3 h-10 w-10 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-xs text-zinc-500">No objects yet</p>
                <p className="mt-1 text-xs text-zinc-600">Add audio, MIDI, or sheet music</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Main Workspace */}
        <main className="flex-1 bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  );
}
