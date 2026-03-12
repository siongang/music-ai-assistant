/**
 * Audio Scheduler
 * 
 * Lookahead scheduler for precise audio playback.
 * Schedules clips ahead of time to prevent drift and gaps.
 */

import type { Clip, Track, Session } from './types';
import { AudioGraph } from './graph';
import { Clock } from './clock';
import { getClipsInWindow, calculateClipScheduling, shouldTrackPlay } from './utils';

/**
 * Lookahead scheduler for audio clips
 * 
 * Uses a lookahead window (200ms) with frequent ticks (25ms)
 * to schedule audio sources ahead of time. This prevents
 * drift and ensures smooth playback.
 */
export class Scheduler {
  private ctx: AudioContext;
  private graph: AudioGraph;
  private clock: Clock;
  private session: Session;
  private buffers: Map<string, AudioBuffer>;
  
  private lookAhead: number = 0.2;          // 200ms lookahead
  private tickInterval: number = 25;        // 25ms tick interval
  private scheduleCursor: number = 0;       // Timeline position of last scheduled audio
  private scheduledClips: Set<string> = new Set(); // Clips already scheduled
  private tickTimer: number | null = null;
  private running: boolean = false;
  
  constructor(
    ctx: AudioContext,
    graph: AudioGraph,
    clock: Clock,
    session: Session,
    buffers: Map<string, AudioBuffer>
  ) {
    this.ctx = ctx;
    this.graph = graph;
    this.clock = clock;
    this.session = session;
    this.buffers = buffers;
  }
  
  /**
   * Start scheduling
   * @param startTime - Timeline time to start from
   */
  start(startTime: number): void {
    if (this.running) {
      return;
    }
    
    this.running = true;
    this.scheduleCursor = startTime;
    this.scheduledClips.clear();
    
    // Start ticking
    this.tick();
  }
  
  /**
   * Stop scheduling
   */
  stop(): void {
    this.running = false;
    
    if (this.tickTimer !== null) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
    
    this.scheduledClips.clear();
  }
  
  /**
   * Reset scheduler to a new timeline position
   * @param timelineSeconds - New timeline position
   */
  reset(timelineSeconds: number): void {
    this.scheduleCursor = timelineSeconds;
    this.scheduledClips.clear();
  }
  
  /**
   * Update session data
   * @param session - New session configuration
   */
  updateSession(session: Session): void {
    this.session = session;
  }
  
  /**
   * Tick function - called repeatedly to schedule audio
   */
  private tick(): void {
    if (!this.running) {
      return;
    }
    
    const currentTime = this.clock.getCurrentTime();
    const scheduleUntil = currentTime + this.lookAhead;
    
    // Schedule clips from cursor to lookahead window
    this.scheduleClipsInWindow(this.scheduleCursor, scheduleUntil);
    
    // Move cursor forward
    this.scheduleCursor = scheduleUntil;
    
    // Schedule next tick
    this.tickTimer = window.setTimeout(() => {
      this.tick();
    }, this.tickInterval);
  }
  
  /**
   * Schedule all clips in a time window
   * @param windowStart - Window start time (timeline seconds)
   * @param windowEnd - Window end time (timeline seconds)
   */
  private scheduleClipsInWindow(windowStart: number, windowEnd: number): void {
    const currentContextTime = this.ctx.currentTime;
    
    this.session.tracks.forEach((track) => {
      // Check if track should play (solo/mute logic)
      if (!shouldTrackPlay(track, this.session.tracks)) {
        return;
      }
      
      // Get clips in this time window
      const clipsToSchedule = getClipsInWindow(track.clips, windowStart, windowEnd);
      
      clipsToSchedule.forEach((clip) => {
        // Skip if already scheduled
        const clipKey = `${track.id}:${clip.id}`;
        if (this.scheduledClips.has(clipKey)) {
          return;
        }
        
        // Get audio buffer
        const buffer = this.buffers.get(clip.assetId);
        if (!buffer) {
          console.warn(`Buffer not loaded for asset ${clip.assetId}`);
          return;
        }
        
        // Calculate scheduling parameters
        const scheduling = calculateClipScheduling(clip, windowStart);
        if (!scheduling) {
          // Clip is in the past, mark as scheduled to avoid re-checking
          this.scheduledClips.add(clipKey);
          return;
        }
        
        const { bufferOffset, duration, delay } = scheduling;
        
        // Calculate when to start in AudioContext time
        const startTime = currentContextTime + delay;
        
        // Ensure buffer offset is within bounds
        const maxOffset = buffer.duration - 0.001; // Small epsilon to prevent edge case
        const clampedOffset = Math.min(Math.max(bufferOffset, 0), maxOffset);
        const clampedDuration = Math.min(duration, buffer.duration - clampedOffset);
        
        if (clampedDuration <= 0) {
          // No duration left to play
          this.scheduledClips.add(clipKey);
          return;
        }
        
        try {
          // Create and schedule the source
          this.graph.createClipSource(
            clip,
            buffer,
            track.id,
            startTime,
            clampedOffset,
            clampedDuration
          );
          
          // Mark as scheduled
          this.scheduledClips.add(clipKey);
        } catch (error) {
          console.error(`Failed to schedule clip ${clip.id}:`, error);
        }
      });
    });
  }
  
  /**
   * Get scheduler status
   */
  getStatus(): {
    running: boolean;
    scheduleCursor: number;
    scheduledClipCount: number;
  } {
    return {
      running: this.running,
      scheduleCursor: this.scheduleCursor,
      scheduledClipCount: this.scheduledClips.size,
    };
  }
}
