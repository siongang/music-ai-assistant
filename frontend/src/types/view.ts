/**
 * View Types
 * 
 * Views are rendering modes for musical objects.
 * They are stateless and only render data; they don't own it.
 * Multiple objects can be viewed simultaneously in the same view mode.
 */

/**
 * Available view modes
 */
export enum ViewMode {
  /** Waveform visualization (for audio) */
  Waveform = 'waveform',
  
  /** Piano roll (for MIDI) */
  Midi = 'midi',
  
  /** Sheet music notation (for MIDI) */
  Sheet = 'sheet',
}

/**
 * View configuration
 * Stores the state of the current view (zoom, scroll, etc.)
 */
export interface ViewConfig {
  /** Current view mode */
  mode: ViewMode;
  
  /** Horizontal zoom level (1.0 = normal) */
  zoom: number;
  
  /** Horizontal scroll position (in pixels) */
  scrollX: number;
  
  /** Vertical scroll position (in pixels) */
  scrollY: number;
  
  /** Optional: Snap to grid */
  snapToGrid?: boolean;
  
  /** Optional: Grid resolution (in beats or pixels) */
  gridResolution?: number;
}

/**
 * Waveform-specific view settings
 */
export interface WaveformViewSettings {
  /** Show amplitude scale */
  showAmplitude?: boolean;
  
  /** Waveform color */
  waveformColor?: string;
  
  /** Show stereo channels separately */
  showStereo?: boolean;
}

/**
 * MIDI view-specific settings
 */
export interface MidiViewSettings {
  /** Show piano keyboard on left */
  showKeyboard?: boolean;
  
  /** Minimum visible note (MIDI number) */
  minNote?: number;
  
  /** Maximum visible note (MIDI number) */
  maxNote?: number;
  
  /** Note color scheme */
  colorScheme?: 'velocity' | 'pitch' | 'channel';
}

/**
 * Sheet music view-specific settings
 */
export interface SheetViewSettings {
  /** Show tablature (for guitar) */
  showTablature?: boolean;
  
  /** Clef type */
  clef?: 'treble' | 'bass' | 'alto' | 'tenor';
  
  /** Show measure numbers */
  showMeasureNumbers?: boolean;
}

/**
 * Track display configuration
 * Controls how a track is rendered in the current view
 */
export interface TrackDisplayConfig {
  /** Track ID */
  trackId: string;
  
  /** Musical object being rendered */
  objectId: string;
  
  /** Is track muted */
  muted: boolean;
  
  /** Is track soloed */
  soloed: boolean;
  
  /** Is track hidden */
  hidden: boolean;
  
  /** Track volume (0.0 - 1.0) */
  volume: number;
  
  /** Track color (for visual distinction) */
  color?: string;
  
  /** Is track selected */
  selected: boolean;
  
  /** Is track expanded (for stem containers) */
  expanded: boolean;
}

/**
 * Timeline configuration
 */
export interface TimelineConfig {
  /** Pixels per second of audio */
  pixelsPerSecond: number;
  
  /** Show time ruler */
  showTimeRuler: boolean;
  
  /** Show beat grid */
  showBeatGrid: boolean;
  
  /** Playhead position (in seconds) */
  playheadPosition: number;
}
