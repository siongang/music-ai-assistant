/**
 * Audio Viewer Component
 * 
 * Main audio timeline viewer with tracks, waveforms, and controls.
 */

"use client";

import { useEffect, useRef, useState } from 'react';
import type { Session, Track as TrackData } from '@/features/audio-engine/core';
import { Playhead } from '@/features/views/waveform/components/Playhead';
import { TimelineRuler } from '@/features/tracks/components/TimelineRuler';
import { TrackHeader } from '@/features/tracks/components/TrackHeader';
import { TrackList } from '@/features/tracks/components/TrackList';
import { TRACK_HEADER_WIDTH, RULER_HEIGHT, TIMELINE_END_PADDING } from '@/features/tracks/components/constants';

export interface AudioViewerProps {
  /** Project ID */
  projectId: string;
  /** Session data */
  session: Session;
  /** Current playback time */
  currentTime: number;
  /** Pixels per second zoom level (default: 50) */
  zoom?: number;
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
  zoom = 50,
  onTrackUpdate,
  onSeek,
  onTrackDelete,
}: AudioViewerProps) {
  const [waveformData, setWaveformData] = useState<Map<string, Array<{ min: number; max: number }> | null>>(
    new Map()
  );
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const requestedAssetIdsRef = useRef<Set<string>>(new Set());
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Sync vertical scroll: whichever panel the user scrolls drives the other
  useEffect(() => {
    const left = leftPanelRef.current;
    const right = rightPanelRef.current;
    if (!left || !right) return;

    let syncingFrom: 'left' | 'right' | null = null;

    const syncFromLeft = () => {
      if (syncingFrom === 'right') return;
      syncingFrom = 'left';
      right.scrollTop = left.scrollTop;
      requestAnimationFrame(() => {
        syncingFrom = null;
      });
    };

    const syncFromRight = () => {
      if (syncingFrom === 'left') return;
      syncingFrom = 'right';
      left.scrollTop = right.scrollTop;
      requestAnimationFrame(() => {
        syncingFrom = null;
      });
    };

    left.addEventListener('scroll', syncFromLeft);
    right.addEventListener('scroll', syncFromRight);
    return () => {
      left.removeEventListener('scroll', syncFromLeft);
      right.removeEventListener('scroll', syncFromRight);
    };
  }, []);
  
  // Calculate total duration
  const duration = session.tracks.reduce((max, track) => {
    const trackEnd = track.clips.reduce((end, clip) => {
      return Math.max(end, clip.start + clip.duration);
    }, 0);
    return Math.max(max, trackEnd);
  }, 10); // Minimum 10 seconds
  
  // Fetch waveform data for all clips
  useEffect(() => {
    const assetIds = new Set<string>();
    session.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        assetIds.add(clip.assetId);
      });
    });

    assetIds.forEach((assetId) => {
      if (requestedAssetIdsRef.current.has(assetId)) {
        return;
      }

      requestedAssetIdsRef.current.add(assetId);
      setLoadingStates((prev) => new Map(prev).set(assetId, true));

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
          requestedAssetIdsRef.current.delete(assetId);
          setWaveformData((prev) => new Map(prev).set(assetId, null));
          setLoadingStates((prev) => new Map(prev).set(assetId, false));
        });
    });
  }, [projectId, session]);
  
  // Tracks are auto-created from audio objects (1:1 mapping)
  // No drag-and-drop track creation needed
  
  const waveformWidth = duration * zoom + TIMELINE_END_PADDING;

  return (
    <div className="flex min-h-0 flex-1 bg-black">
      {/* LEFT PANEL — track controls, fixed width, vertical scroll only */}
      <div
        ref={leftPanelRef}
        className="flex-shrink-0 overflow-y-auto overflow-x-hidden border-r border-zinc-800/30"
        style={{ width: `${TRACK_HEADER_WIDTH}px` }}
      >
        {/* Spacer that matches ruler height so headers align with waveforms */}
        <div className="sticky top-0 z-10 border-b border-zinc-800/30 bg-zinc-950" style={{ height: `${RULER_HEIGHT}px` }} />
        {/* Track headers — one per track, same height as waveform rows */}
        {session.tracks.map((track) => (
          <TrackHeader
            key={track.id}
            name={track.name || 'Untitled Track'}
            mute={track.mute}
            solo={track.solo}
            gain={track.gain}
            pan={track.pan}
            onMuteToggle={() => onTrackUpdate?.(track.id, { mute: !track.mute })}
            onSoloToggle={() => onTrackUpdate?.(track.id, { solo: !track.solo })}
            onGainChange={(gain) => onTrackUpdate?.(track.id, { gain })}
            onPanChange={(pan) => onTrackUpdate?.(track.id, { pan })}
            onDelete={() => onTrackDelete?.(track.id)}
          />
        ))}
      </div>

      {/* RIGHT PANEL — ruler + waveforms, scrolls both axes */}
      <div
        ref={rightPanelRef}
        className="relative min-w-0 flex-1 overflow-auto"
      >
        <div className="relative" style={{ width: `${waveformWidth}px` }}>
          <TimelineRuler
            duration={duration}
            pixelsPerSecond={zoom}
            height={RULER_HEIGHT}
            onSeek={onSeek}
          />
          <Playhead
            scrollContainerRef={rightPanelRef}
            currentTime={currentTime}
            pixelsPerSecond={zoom}
            rulerHeight={RULER_HEIGHT}
            onSeek={onSeek}
          />
          {/* Waveform-only track list (no headers) */}
          <TrackList
            tracks={session.tracks}
            currentTime={currentTime}
            pixelsPerSecond={zoom}
            waveformData={waveformData}
            loadingStates={loadingStates}
          />
        </div>
      </div>
    </div>
  );
}
