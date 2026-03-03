/**
 * Track Component
 * 
 * Displays a single track with header and clips.
 */

"use client";

import React from 'react';
import { Track as TrackData } from '@/audio_engine';
import { TrackHeader } from './TrackHeader';
import { WaveformRenderer } from './WaveformRenderer';

export interface TrackProps {
  /** Track data */
  track: TrackData;
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
  height: number;
  /** On track update */
  onUpdate?: (updates: Partial<TrackData>) => void;
  /** On track delete */
  onDelete?: () => void;
}

/**
 * Track with header and clips
 */
export function Track({
  track,
  projectId,
  currentTime,
  pixelsPerSecond,
  waveformData,
  loadingStates,
  height,
  onUpdate,
  onDelete,
}: TrackProps) {
  const handleMuteToggle = () => {
    onUpdate?.({ mute: !track.mute });
  };
  
  const handleSoloToggle = () => {
    onUpdate?.({ solo: !track.solo });
  };
  
  const handleGainChange = (gain: number) => {
    onUpdate?.({ gain });
  };
  
  const handlePanChange = (pan: number) => {
    onUpdate?.({ pan });
  };
  
  // No drag-and-drop needed - tracks represent audio objects 1:1
  // Each track already has its full audio object displayed
  
  return (
    <div className="flex border-b border-zinc-800/50" style={{ height: `${height}px` }}>
      {/* Track header (fixed width) */}
      <TrackHeader
        name={track.name || 'Untitled Track'}
        mute={track.mute}
        solo={track.solo}
        gain={track.gain}
        pan={track.pan}
        onMuteToggle={handleMuteToggle}
        onSoloToggle={handleSoloToggle}
        onGainChange={handleGainChange}
        onPanChange={handlePanChange}
        onDelete={onDelete}
      />
      
      {/* Clip area - same height as track, waveform fills it */}
      <div className="relative flex-1 min-h-0 bg-black" style={{ height: `${height}px` }}>
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
                top: 0,
                bottom: 0,
                height: `${height}px`,
              }}
            >
              <WaveformRenderer
                projectId={projectId}
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
    </div>
  );
}
