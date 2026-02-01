/**
 * Transport Bar Component
 * 
 * Bottom playback controls (play, stop, loop, time display)
 */

'use client';

export interface TransportBarProps {
  onPlay?: () => void;
  onStop?: () => void;
  onLoop?: () => void;
  currentTime?: string;
}

export function TransportBar({
  onPlay,
  onStop,
  onLoop,
  currentTime = '00:00.0',
}: TransportBarProps) {
  return (
    <footer className="flex h-16 shrink-0 items-center justify-center bg-black px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPlay}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            aria-label="Play"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onStop}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            aria-label="Stop"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onLoop}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            aria-label="Loop"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        <div className="font-mono text-lg font-medium text-white">{currentTime}</div>
      </div>
    </footer>
  );
}
