/**
 * Timeline Clock
 * 
 * Manages the relationship between AudioContext time and timeline time.
 * Provides accurate time tracking during playback.
 */

/**
 * Clock for timeline time management
 * 
 * Maps between AudioContext.currentTime (audio time) and timeline seconds.
 * Handles start/stop and provides current timeline position.
 */
export class Clock {
  private ctx: AudioContext;
  private startTime: number = 0;      // AudioContext time when play started
  private startOffset: number = 0;    // Timeline seconds at play start
  private running: boolean = false;
  
  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }
  
  /**
   * Start the clock at a specific timeline position
   * @param timelineSeconds - Starting position on timeline
   */
  start(timelineSeconds: number): void {
    this.startTime = this.ctx.currentTime;
    this.startOffset = timelineSeconds;
    this.running = true;
  }
  
  /**
   * Stop the clock and return current timeline time
   * @returns Current timeline time in seconds
   */
  stop(): number {
    const currentTime = this.getCurrentTime();
    this.running = false;
    return currentTime;
  }
  
  /**
   * Get current timeline time
   * @returns Timeline time in seconds
   */
  getCurrentTime(): number {
    if (!this.running) {
      return this.startOffset;
    }
    
    const elapsed = this.ctx.currentTime - this.startTime;
    return this.startOffset + elapsed;
  }
  
  /**
   * Check if clock is running
   * @returns True if clock is running
   */
  isRunning(): boolean {
    return this.running;
  }
  
  /**
   * Reset clock to a specific time without starting
   * @param timelineSeconds - Timeline position to reset to
   */
  reset(timelineSeconds: number): void {
    this.startOffset = timelineSeconds;
    this.startTime = this.ctx.currentTime;
    this.running = false;
  }
}
