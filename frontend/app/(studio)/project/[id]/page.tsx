/**
 * Project Workstation Page
 * 
 * Main DAW workspace for editing audio, viewing waveforms, etc.
 */

export default function ProjectPage() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-950 ring-1 ring-zinc-800">
          <svg className="h-8 w-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-zinc-100">
          Waveform Editor
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          Interactive waveform visualization and editing
        </p>
        <div className="inline-flex items-center gap-1.5 rounded border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs text-cyan-400">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Coming soon
        </div>
      </div>
    </div>
  );
}
