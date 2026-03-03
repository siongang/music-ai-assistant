/**
 * Audio Engine
 * 
 * Main audio engine class that orchestrates playback, mixing, and scheduling.
 * Provides a clean API for the UI layer.
 */

// Import enums as values (they exist at runtime)
import { AssetStatus, EngineEvent } from './types';
// Import types only
import type {
  AudioAsset,
  Session,
  Track,
  EventHandler,
  TimeEventPayload,
  StateEventPayload,
  AssetLoadedEventPayload,
  ErrorEventPayload,
} from './types';
import { EventEmitter } from './events';
import { Clock } from './clock';
import { AudioGraph } from './graph';
import { Scheduler } from './scheduler';
import { clamp } from './utils';

/**
 * Main Audio Engine class
 * 
 * Manages audio playback with Web Audio API.
 * Supports multi-track playback, mixing, and timeline control.
 * 
 * ARCHITECTURE:
 * - Pure TypeScript, no React dependencies
 * - Event-driven updates for UI consumption
 * - Separates data (Session) from runtime (AudioContext, nodes)
 * - Lookahead scheduling prevents drift
 */
export class AudioEngine {
  // Audio context and components
  private ctx: AudioContext | null = null;
  private graph: AudioGraph | null = null;
  private clock: Clock | null = null;
  private scheduler: Scheduler | null = null;
  private events: EventEmitter;
  
  // State
  private session: Session = { tracks: [], masterGain: 1.0 };
  private assets: Map<string, AudioAsset> = new Map();
  private buffers: Map<string, AudioBuffer> = new Map();
  private assetStatuses: Map<string, AssetStatus> = new Map();
  private initialized: boolean = false;
  
  // Playback state
  private _isPlaying: boolean = false;
  private currentTime: number = 0;
  
  // Time update interval
  private timeUpdateInterval: number | null = null;
  private timeUpdateRate: number = 100; // Update UI every 100ms
  
  constructor() {
    this.events = new EventEmitter();
  }
  
  /**
   * Initialize the audio engine
   * Must be called from a user gesture (click, touch, etc.)
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Create AudioContext
      this.ctx = new AudioContext();
      
      // Resume if suspended (browser autoplay policy)
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      
      // Create components
      this.graph = new AudioGraph(this.ctx);
      this.clock = new Clock(this.ctx);
      this.scheduler = new Scheduler(
        this.ctx,
        this.graph,
        this.clock,
        this.session,
        this.buffers
      );
      
      this.initialized = true;
      
      console.log('Audio engine initialized');
    } catch (error) {
      this.emitError('Failed to initialize audio engine', error as Error);
      throw error;
    }
  }
  
  /**
   * Dispose of the audio engine
   */
  dispose(): void {
    this.stop();
    
    if (this.graph) {
      this.graph.dispose();
    }
    
    if (this.ctx) {
      this.ctx.close();
    }
    
    this.events.clear();
    this.initialized = false;
    
    console.log('Audio engine disposed');
  }
  
  // ============================================
  // ASSET MANAGEMENT
  // ============================================
  
  /**
   * Add an audio asset
   * @param asset - Audio asset to add
   */
  addAsset(asset: AudioAsset): void {
    this.assets.set(asset.id, asset);
    this.assetStatuses.set(asset.id, AssetStatus.NotLoaded);
  }
  
  /**
   * Preload an audio asset
   * @param assetId - Asset ID to load
   */
  async preloadAsset(assetId: string): Promise<void> {
    if (!this.ctx) {
      throw new Error('Audio engine not initialized');
    }
    
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }
    
    // Check if already loaded
    if (this.buffers.has(assetId)) {
      return;
    }
    
    // Check if already loading
    if (this.assetStatuses.get(assetId) === AssetStatus.Loading) {
      return;
    }
    
    this.assetStatuses.set(assetId, AssetStatus.Loading);
    
    try {
      // Fetch audio file
      const response = await fetch(asset.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      
      // Store buffer
      this.buffers.set(assetId, audioBuffer);
      this.assetStatuses.set(assetId, AssetStatus.Loaded);
      
      // Update asset duration
      asset.duration = audioBuffer.duration;
      
      // Emit event
      this.events.emit(EngineEvent.AssetLoaded, {
        assetId,
        duration: audioBuffer.duration,
      } as AssetLoadedEventPayload);
      
      console.log(`Loaded asset ${assetId}: ${audioBuffer.duration}s`);
    } catch (error) {
      this.assetStatuses.set(assetId, AssetStatus.Error);
      this.emitError(`Failed to load asset ${assetId}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Get asset status
   * @param assetId - Asset ID
   * @returns Asset status
   */
  getAssetStatus(assetId: string): AssetStatus {
    return this.assetStatuses.get(assetId) ?? AssetStatus.NotLoaded;
  }
  
  // ============================================
  // SESSION MANAGEMENT
  // ============================================
  
  /**
   * Load a session
   * @param session - Session data
   */
  loadSession(session: Session): void {
    if (!this.graph) {
      throw new Error('Audio engine not initialized');
    }
    
    // Stop current playback
    if (this._isPlaying) {
      this.stop();
    }
    
    this.session = session;
    
    // Create track nodes
    session.tracks.forEach((track) => {
      this.graph!.createTrack(track.id);
      this.graph!.setTrackGain(track.id, track.gain);
      this.graph!.setTrackPan(track.id, track.pan);
    });
    
    // Set master gain
    this.graph.setMasterGain(session.masterGain);
    
    // Update scheduler
    if (this.scheduler) {
      this.scheduler.updateSession(session);
    }
    
    console.log(`Loaded session with ${session.tracks.length} tracks`);
  }
  
  /**
   * Get current session
   * @returns Current session
   */
  getSession(): Session {
    return this.session;
  }
  
  // ============================================
  // TRANSPORT CONTROLS
  // ============================================
  
  /**
   * Start playback
   */
  play(): void {
    if (!this.ctx || !this.graph || !this.clock || !this.scheduler) {
      throw new Error('Audio engine not initialized');
    }
    
    if (this._isPlaying) {
      return;
    }
    
    // Resume AudioContext if needed
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Start clock
    this.clock.start(this.currentTime);
    
    // Start scheduler
    this.scheduler.start(this.currentTime);
    
    // Update state
    this._isPlaying = true;
    this.emitState(true);
    
    // Start time updates
    this.startTimeUpdates();
    
    console.log(`Playback started at ${this.currentTime}s`);
  }
  
  /**
   * Pause playback
   */
  pause(): void {
    if (!this._isPlaying) {
      return;
    }
    
    if (!this.clock || !this.scheduler || !this.graph) {
      return;
    }
    
    // Stop scheduler
    this.scheduler.stop();
    
    // Stop all audio sources
    this.graph.stopAllSources();
    
    // Update current time from clock
    this.currentTime = this.clock.stop();
    
    // Update state
    this._isPlaying = false;
    this.emitState(false);
    
    // Stop time updates
    this.stopTimeUpdates();
    
    console.log(`Playback paused at ${this.currentTime}s`);
  }
  
  /**
   * Stop playback and reset to start
   */
  stop(): void {
    if (!this.graph) {
      return;
    }
    
    // Pause first
    if (this._isPlaying) {
      this.pause();
    }
    
    // Reset to start
    this.currentTime = 0;
    
    if (this.clock) {
      this.clock.reset(0);
    }
    
    if (this.scheduler) {
      this.scheduler.reset(0);
    }
    
    this.emitTime(0);
    
    console.log('Playback stopped');
  }
  
  /**
   * Seek to a specific time
   * @param seconds - Time in seconds
   */
  seek(seconds: number): void {
    if (!this.graph || !this.clock || !this.scheduler) {
      throw new Error('Audio engine not initialized');
    }
    
    const wasPlaying = this._isPlaying;
    
    // Stop current playback
    if (wasPlaying) {
      this.pause();
    }
    
    // Update time
    this.currentTime = Math.max(0, seconds);
    
    // Reset clock and scheduler
    this.clock.reset(this.currentTime);
    this.scheduler.reset(this.currentTime);
    
    // Emit time update
    this.emitTime(this.currentTime);
    
    // Resume if was playing
    if (wasPlaying) {
      this.play();
    }
    
    console.log(`Seeked to ${this.currentTime}s`);
  }
  
  /**
   * Get current playback time
   * @returns Current time in seconds
   */
  getCurrentTime(): number {
    if (this._isPlaying && this.clock) {
      return this.clock.getCurrentTime();
    }
    return this.currentTime;
  }
  
  /**
   * Check if playing
   * @returns True if playing
   */
  isPlaying(): boolean {
    return this._isPlaying;
  }
  
  // ============================================
  // MIX CONTROLS
  // ============================================
  
  /**
   * Set track gain
   * @param trackId - Track ID
   * @param gain - Gain value (0.0 to 2.0)
   */
  setTrackGain(trackId: string, gain: number): void {
    if (!this.graph) {
      throw new Error('Audio engine not initialized');
    }
    
    this.graph.setTrackGain(trackId, gain);
    
    // Update session
    const track = this.session.tracks.find((t) => t.id === trackId);
    if (track) {
      track.gain = clamp(gain, 0, 2);
    }
  }
  
  /**
   * Set track pan
   * @param trackId - Track ID
   * @param pan - Pan value (-1.0 to 1.0)
   */
  setTrackPan(trackId: string, pan: number): void {
    if (!this.graph) {
      throw new Error('Audio engine not initialized');
    }
    
    this.graph.setTrackPan(trackId, pan);
    
    // Update session
    const track = this.session.tracks.find((t) => t.id === trackId);
    if (track) {
      track.pan = clamp(pan, -1, 1);
    }
  }
  
  /**
   * Set track mute
   * @param trackId - Track ID
   * @param muted - Mute state
   */
  setTrackMute(trackId: string, muted: boolean): void {
    const track = this.session.tracks.find((t) => t.id === trackId);
    if (track) {
      track.mute = muted;
      
      // If playing, restart to apply mute
      if (this._isPlaying) {
        const currentTime = this.getCurrentTime();
        this.pause();
        this.seek(currentTime);
        this.play();
      }
    }
  }
  
  /**
   * Set track solo
   * @param trackId - Track ID
   * @param solo - Solo state
   */
  setTrackSolo(trackId: string, solo: boolean): void {
    const track = this.session.tracks.find((t) => t.id === trackId);
    if (track) {
      track.solo = solo;
      
      // If playing, restart to apply solo
      if (this._isPlaying) {
        const currentTime = this.getCurrentTime();
        this.pause();
        this.seek(currentTime);
        this.play();
      }
    }
  }
  
  /**
   * Set master gain
   * @param gain - Gain value (0.0 to 2.0)
   */
  setMasterGain(gain: number): void {
    if (!this.graph) {
      throw new Error('Audio engine not initialized');
    }
    
    this.graph.setMasterGain(gain);
    this.session.masterGain = clamp(gain, 0, 2);
  }
  
  // ============================================
  // EVENTS
  // ============================================
  
  /**
   * Subscribe to an event
   * @param event - Event type
   * @param handler - Event handler
   */
  on(event: EngineEvent, handler: EventHandler): void {
    this.events.on(event, handler);
  }
  
  /**
   * Unsubscribe from an event
   * @param event - Event type
   * @param handler - Event handler
   */
  off(event: EngineEvent, handler: EventHandler): void {
    this.events.off(event, handler);
  }
  
  // ============================================
  // PRIVATE METHODS
  // ============================================
  
  private startTimeUpdates(): void {
    if (this.timeUpdateInterval !== null) {
      return;
    }
    
    this.timeUpdateInterval = window.setInterval(() => {
      if (this._isPlaying && this.clock) {
        const time = this.clock.getCurrentTime();
        this.emitTime(time);
      }
    }, this.timeUpdateRate);
  }
  
  private stopTimeUpdates(): void {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }
  
  private emitTime(time: number): void {
    this.events.emit(EngineEvent.Time, {
      currentTime: time,
    } as TimeEventPayload);
  }
  
  private emitState(isPlaying: boolean): void {
    this.events.emit(EngineEvent.State, {
      isPlaying,
    } as StateEventPayload);
  }
  
  private emitError(message: string, error?: Error): void {
    this.events.emit(EngineEvent.Error, {
      message,
      error,
    } as ErrorEventPayload);
    console.error(message, error);
  }
}
