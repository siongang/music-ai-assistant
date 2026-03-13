/**
 * Audio Engine Type Definitions
 * 
 * Pure, serializable data structures for the audio engine.
 * NO React dependencies - this is framework-agnostic.
 */

/**
 * Audio asset reference
 */
export interface AudioAsset {
  id: string;
  url: string;
  duration?: number;
}

/**
 * Status of an audio asset
 */
export enum AssetStatus {
  NotLoaded = 'not_loaded',
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

/**
 * Clip placement on timeline
 */
export interface Clip {
  id: string;
  assetId: string;
  start: number;        // timeline seconds
  in: number;           // source offset seconds
  duration: number;     // timeline duration
  playbackRate?: number; // default 1.0 (not used yet, reserved for future)
}

/**
 * Track with clips and mix settings
 */
export interface Track {
  id: string;
  name?: string;
  clips: Clip[];
  gain: number;         // 0.0 to 2.0 (1.0 = unity)
  pan: number;          // -1.0 (left) to 1.0 (right), 0.0 = center
  mute: boolean;
  solo: boolean;
}

/**
 * Session configuration
 */
export interface Session {
  tracks: Track[];
  masterGain: number;   // 0.0 to 2.0 (1.0 = unity)
}

/**
 * Transport state
 */
export interface TransportState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

/**
 * Loop configuration (reserved for future)
 */
export interface LoopState {
  enabled: boolean;
  start: number;
  end: number;
}

/**
 * Engine events
 */
export enum EngineEvent {
  Time = 'time',
  State = 'state',
  AssetLoaded = 'assetLoaded',
  Error = 'error',
}

/**
 * Event payloads
 */
export interface TimeEventPayload {
  currentTime: number;
}

export interface StateEventPayload {
  isPlaying: boolean;
}

export interface AssetLoadedEventPayload {
  assetId: string;
  duration: number;
}

export interface ErrorEventPayload {
  message: string;
  error?: Error;
}

/**
 * Event handler types
 */
export type TimeEventHandler = (payload: TimeEventPayload) => void;
export type StateEventHandler = (payload: StateEventPayload) => void;
export type AssetLoadedEventHandler = (payload: AssetLoadedEventPayload) => void;
export type ErrorEventHandler = (payload: ErrorEventPayload) => void;

/**
 * Generic event handler
 */
export type EventHandler = TimeEventHandler | StateEventHandler | AssetLoadedEventHandler | ErrorEventHandler;
