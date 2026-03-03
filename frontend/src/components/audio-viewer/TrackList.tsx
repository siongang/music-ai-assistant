/**
 * Track List Component
 * 
 * Displays all tracks in a scrollable list.
 */

"use client";

import { Track as TrackData } from '@/audio_engine';
import { DEFAULT_TRACK_HEIGHT } from './constants';
import { Track } from './Track';

export interface TrackListProps {
  /** All tracks */
  tracks: TrackData[];
  /** Project ID */
  projectId: string;
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
  /** On track update */
  onTrackUpdate?: (trackId: string, updates: Partial<TrackData>) => void;
  /** On track delete */
  onTrackDelete?: (trackId: string) => void;
}

/**
 * List of tracks (scrollable)
 */
export function TrackList({
  tracks,
  projectId,
  currentTime,
  pixelsPerSecond,
  waveformData,
  loadingStates,
  trackHeight = DEFAULT_TRACK_HEIGHT,
  onTrackUpdate,
  onTrackDelete,
}: TrackListProps) {
  return (
    <div className="flex flex-col">
      {tracks.map((track) => (
        <Track
          key={track.id}
          track={track}
          projectId={projectId}
          currentTime={currentTime}
          pixelsPerSecond={pixelsPerSecond}
          waveformData={waveformData}
          loadingStates={loadingStates}
          height={trackHeight}
          onUpdate={(updates) => onTrackUpdate?.(track.id, updates)}
          onDelete={() => onTrackDelete?.(track.id)}
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
