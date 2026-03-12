/**
 * Audio Engine Utilities
 * 
 * Helper functions for timeline calculations and audio operations.
 */

import type { Clip, Track } from './types';

/**
 * Convert timeline time to source buffer time
 * 
 * FUTURE-PROOF: This function will handle time-stretch and pitch-shift.
 * For now, it's a simple offset calculation.
 * 
 * @param timelineSeconds - Current time on timeline
 * @param clip - Clip configuration
 * @returns Source buffer time in seconds
 */
export function timelineToSourceTime(
  timelineSeconds: number,
  clip: Clip
): number {
  // FUTURE: Add time-stretch logic here
  // For now: sourceTime = clip.in + (timelineSeconds - clip.start)
  const relativeTime = timelineSeconds - clip.start;
  return clip.in + relativeTime;
}

/**
 * Check if a clip should play at a given timeline time
 * 
 * @param clip - Clip to check
 * @param timelineTime - Current timeline time in seconds
 * @returns True if clip is active at this time
 */
export function isClipActive(clip: Clip, timelineTime: number): boolean {
  const clipEnd = clip.start + clip.duration;
  return timelineTime >= clip.start && timelineTime < clipEnd;
}

/**
 * Get clips that should be scheduled in a time window
 * 
 * @param clips - Array of clips
 * @param windowStart - Window start time in seconds
 * @param windowEnd - Window end time in seconds
 * @returns Array of clips in the window
 */
export function getClipsInWindow(
  clips: Clip[],
  windowStart: number,
  windowEnd: number
): Clip[] {
  return clips.filter((clip) => {
    const clipEnd = clip.start + clip.duration;
    // Clip overlaps window if:
    // - Clip starts before window ends AND
    // - Clip ends after window starts
    return clip.start < windowEnd && clipEnd > windowStart;
  });
}

/**
 * Calculate buffer offset and duration for a clip scheduled at a given time
 * 
 * @param clip - Clip configuration
 * @param scheduleTime - Time when scheduling happens (timeline seconds)
 * @returns Object with bufferOffset and duration, or null if clip shouldn't play
 */
export function calculateClipScheduling(
  clip: Clip,
  scheduleTime: number
): { bufferOffset: number; duration: number; delay: number } | null {
  const clipEnd = clip.start + clip.duration;
  
  // If schedule time is after clip ends, don't schedule
  if (scheduleTime >= clipEnd) {
    return null;
  }
  
  // If schedule time is before clip starts, schedule with delay
  if (scheduleTime < clip.start) {
    return {
      bufferOffset: clip.in,
      duration: clip.duration,
      delay: clip.start - scheduleTime,
    };
  }
  
  // Schedule time is during clip playback
  const elapsedTime = scheduleTime - clip.start;
  const bufferOffset = clip.in + elapsedTime;
  const remainingDuration = clip.duration - elapsedTime;
  
  return {
    bufferOffset,
    duration: remainingDuration,
    delay: 0,
  };
}

/**
 * Check if any tracks are soloed
 * 
 * @param tracks - Array of tracks
 * @returns True if at least one track is soloed
 */
export function hasAnySoloTracks(tracks: Track[]): boolean {
  return tracks.some((track) => track.solo);
}

/**
 * Check if a track should play (considering solo/mute logic)
 * 
 * Solo/Mute Rules:
 * - Mute always wins (muted tracks never play)
 * - If any track is solo, only solo tracks play
 * - Otherwise, all non-muted tracks play
 * 
 * @param track - Track to check
 * @param allTracks - All tracks in session
 * @returns True if track should play
 */
export function shouldTrackPlay(track: Track, allTracks: Track[]): boolean {
  // Muted tracks never play
  if (track.mute) {
    return false;
  }
  
  // Check if any tracks are soloed
  const anySolo = hasAnySoloTracks(allTracks);
  
  if (anySolo) {
    // Only soloed tracks play
    return track.solo;
  }
  
  // No solo tracks, play all non-muted tracks
  return true;
}

/**
 * Clamp a number between min and max
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format time in seconds to MM:SS.s format
 * 
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
}
