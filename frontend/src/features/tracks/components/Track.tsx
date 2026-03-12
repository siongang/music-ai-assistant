/**
 * Track Component
 * 
 * Displays a single track with header and clips.
 */

"use client";

import type { Track as TrackData } from '@/features/audio-engine/core';
import { WaveformRenderer } from '@/features/views/waveform/components/WaveformRenderer';

export interface TrackProps {
  /** Track data */
  track: TrackData;
  /** Current playback time */
  currentTime: number;
  /** Pixels per second (zoom level) */
  pixelsPerSecond: number;
  /** Waveform data by asset ID */
  waveformData: Map<string, Array<{ min: number; max: number }> | null>;
  /** Loading states by asset ID */
  loadingStates: Map<string, boolean>;
  /** Track height */
  height: number;
}

/**
 * Track waveform area — header is rendered separately in the left panel
 */
export function Track({
  track,
  currentTime,
  pixelsPerSecond,
  waveformData,
  loadingStates,
  height,
}: TrackProps) {
  return (
    <div className="relative border-b border-zinc-800/50 bg-black" style={{ height: `${height}px` }}>
      {track.clips.map((clip) => {
        const clipX = clip.start * pixelsPerSecond;
        const clipWidth = clip.duration * pixelsPerSecond;
        
        const peaks = waveformData.get(clip.assetId) || null;
        const loading = loadingStates.get(clip.assetId) || false;
        
        return (
          <div
            key={clip.id}
            className="absolute inset-y-0 rounded border border-zinc-800/80 bg-zinc-950 shadow-lg overflow-hidden"
            style={{
              left: `${clipX}px`,
              width: `${clipWidth}px`,
            }}
          >
            <WaveformRenderer
              audioId={clip.assetId}
              peaks={peaks}
              loading={loading}
              width={clipWidth}
              height={height}
              currentTime={currentTime}
              startTime={clip.start}
              duration={clip.duration}
              pixelsPerSecond={pixelsPerSecond}
            />
          </div>
        );
      })}
    </div>
  );
}
