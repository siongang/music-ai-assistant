/**
 * Track List Component
 * 
 * Displays all tracks in a scrollable list.
 */

"use client";

import type { Track as TrackData } from '@/features/audio-engine/core';
import { DEFAULT_TRACK_HEIGHT } from './constants';
import { Track } from './Track';

export interface TrackListProps {
  /** All tracks */
  tracks: TrackData[];
  /** Current playback time */
  currentTime: number;
  /** Pixels per second (zoom level) */
  pixelsPerSecond: number;
  /** Waveform data by asset ID */
  waveformData: Map<string, Array<{ min: number; max: number }> | null>;
  /** Loading states by asset ID */
  loadingStates: Map<string, boolean>;
  /** Track height */
  trackHeight?: number;
}

/**
 * Waveform-only track list — headers are rendered in the left panel
 */
export function TrackList({
  tracks,
  currentTime,
  pixelsPerSecond,
  waveformData,
  loadingStates,
  trackHeight = DEFAULT_TRACK_HEIGHT,
}: TrackListProps) {
  return (
    <div className="flex flex-col">
      {tracks.map((track) => (
        <Track
          key={track.id}
          track={track}
          currentTime={currentTime}
          pixelsPerSecond={pixelsPerSecond}
          waveformData={waveformData}
          loadingStates={loadingStates}
          height={trackHeight}
        />
      ))}
      
      {tracks.length === 0 && (
        <div className="flex h-64 items-center justify-center text-zinc-500">
          <div className="text-center">
            <p className="text-sm">No audio objects yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Upload audio files to see them here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
