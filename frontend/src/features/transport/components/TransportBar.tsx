/**
 * Transport Bar Component
 * 
 * Bottom playback controls (play, stop, loop, time display)
 * Connected to AudioEngineContext for playback control
 */

'use client';

import { useAudioEngine } from '@/features/audio-engine/context/AudioEngineContext';

export function TransportBar() {
  const { isPlaying, isInitialized, formattedTime, togglePlayPause, stop } = useAudioEngine();

  return (
    <footer className="relative flex h-16 shrink-0 items-center justify-center border-t border-zinc-900 bg-black px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {/* Play/Pause Toggle */}
          <button
            type="button"
            onClick={togglePlayPause}
            className={`rounded-lg p-2 transition-colors ${
              isPlaying
                ? 'text-cyan-400 hover:bg-zinc-900 hover:text-cyan-300'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={!isInitialized ? 'Click to start audio engine' : undefined}
          >
            {isPlaying ? (
              // Pause icon
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              // Play icon
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          {/* Stop Button */}
          <button
            type="button"
            onClick={stop}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            aria-label="Stop"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>

          <button
            type="button"
            disabled
            className="rounded-lg p-2 text-zinc-700"
            aria-label="Loop"
            title="Loop is not wired yet"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {/* Time Display */}
        <div className="font-mono text-lg font-medium text-white">{formattedTime}</div>
      </div>
      
      {/* Audio Engine Status */}
      {!isInitialized && (
        <div className="absolute right-6 text-xs text-zinc-500">
          Click play to start audio engine
        </div>
      )}
    </footer>
  );
}
