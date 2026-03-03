/**
 * Audio Viewer Component
 * 
 * Main audio timeline viewer with tracks, waveforms, and controls.
 */

"use client";

import { useState, useEffect } from 'react';
import { Session, Track as TrackData } from '@/audio_engine';
import { TrackList, Playhead } from '@/components/audio-viewer';
import { TimelineRuler } from '@/components/audio-viewer/TimelineRuler';

export interface AudioViewerProps {
  /** Project ID */
  projectId: string;
  /** Session data */
  session: Session;
  /** Current playback time */
  currentTime: number;
  /** Is playing */
  isPlaying: boolean;
  /** On track update */
  onTrackUpdate?: (trackId: string, updates: Partial<TrackData>) => void;
  /** On seek */
  onSeek?: (time: number) => void;
  /** On track delete */
  onTrackDelete?: (trackId: string) => void;
}

/**
 * Audio timeline viewer
 * 
 * Displays tracks, waveforms, timeline ruler, and controls.
 */
export function AudioViewer({
  projectId,
  session,
  currentTime,
  isPlaying,
  onTrackUpdate,
  onSeek,
  onTrackDelete,
}: AudioViewerProps) {
  const [zoom, setZoom] = useState(50); // pixels per second
  const [waveformData, setWaveformData] = useState<Map<string, Array<{ min: number; max: number }> | null>>(
    new Map()
  );
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  
  // Calculate total duration
  const duration = session.tracks.reduce((max, track) => {
    const trackEnd = track.clips.reduce((end, clip) => {
      return Math.max(end, clip.start + clip.duration);
    }, 0);
    return Math.max(max, trackEnd);
  }, 10); // Minimum 10 seconds
  
  // Calculate timeline width
  const timelineWidth = Math.max(duration * zoom, 1000);
  
  // Fetch waveform data for all clips
  useEffect(() => {
    const assetIds = new Set<string>();
    session.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        assetIds.add(clip.assetId);
      });
    });
    
    assetIds.forEach((assetId) => {
      // Skip if already loaded or loading
      if (waveformData.has(assetId) || loadingStates.get(assetId)) {
        return;
      }
      
      // Mark as loading
      setLoadingStates((prev) => new Map(prev).set(assetId, true));
      
      // Fetch waveform data
      fetch(`/api/projects/${projectId}/audio/${assetId}/waveform?level=512`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch waveform');
          }
          return res.json();
        })
        .then((data) => {
          setWaveformData((prev) => new Map(prev).set(assetId, data.peaks));
          setLoadingStates((prev) => new Map(prev).set(assetId, false));
        })
        .catch((error) => {
          console.error(`Failed to load waveform for ${assetId}:`, error);
          setWaveformData((prev) => new Map(prev).set(assetId, null));
          setLoadingStates((prev) => new Map(prev).set(assetId, false));
        });
    });
  }, [session, projectId, waveformData, loadingStates]);
  
  // Tracks are auto-created from audio objects (1:1 mapping)
  // No drag-and-drop track creation needed
  
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-black">
      {/* Timeline Ruler */}
      <TimelineRuler 
        duration={duration} 
        pixelsPerSecond={zoom}
        onSeek={onSeek}
      />
      
      {/* Track Area (scrollable): min-h-0 so it shrinks and scrolls within available height */}
      <div className="relative min-h-0 flex-1 overflow-auto">
        {/* Playhead - positioned to start just above tracks */}
        <div className="pointer-events-none absolute inset-0 z-30" style={{ top: '-8px' }}>
          <Playhead currentTime={currentTime} pixelsPerSecond={zoom} onSeek={onSeek} />
        </div>
        
        <div className="relative">
          {/* Track List */}
          <TrackList
            tracks={session.tracks}
            projectId={projectId}
            currentTime={currentTime}
            pixelsPerSecond={zoom}
            waveformData={waveformData}
            loadingStates={loadingStates}
            onTrackUpdate={onTrackUpdate}
            onTrackDelete={onTrackDelete}
          />
        </div>
      </div>
    </div>
  );
}
