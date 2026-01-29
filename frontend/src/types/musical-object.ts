/**
 * Musical Object Types
 * 
 * MusicalObjects are the core entities in the workspace.
 * They form a hierarchical tree structure (parent/child relationships).
 */

/**
 * Types of musical objects
 */
export enum ObjectType {
  /** Audio file (.wav, .mp3, etc.) */
  Audio = 'audio',
  /** MIDI file or data */
  Midi = 'midi',
  /** Sheet music notation */
  Sheet = 'sheet',
  /** Stem separation results (container with multiple audio children) */
  Stems = 'stems',
}

/**
 * Base musical object interface
 * All objects in the tree implement this interface
 */
export interface MusicalObject {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Object type */
  type: ObjectType;
  
  /** Parent object ID (null for root objects) */
  parentId: string | null;
  
  /** Child objects (for hierarchical relationships) */
  children: MusicalObject[];
  
  /** Flexible metadata storage for type-specific data */
  metadata: Record<string, unknown>;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Audio-specific metadata
 */
export interface AudioMetadata {
  /** File path or URL */
  filePath?: string;
  
  /** Duration in seconds */
  duration?: number;
  
  /** Sample rate (e.g., 44100) */
  sampleRate?: number;
  
  /** Number of channels (1 = mono, 2 = stereo) */
  channels?: number;
  
  /** File format (wav, mp3, etc.) */
  format?: string;
  
  /** File size in bytes */
  fileSize?: number;
}

/**
 * Audio object (extends MusicalObject with audio-specific metadata)
 */
export interface AudioObject extends MusicalObject {
  type: ObjectType.Audio;
  metadata: AudioMetadata & Record<string, unknown>;
}

/**
 * MIDI-specific metadata
 */
export interface MidiMetadata {
  /** File path or URL */
  filePath?: string;
  
  /** Duration in seconds */
  duration?: number;
  
  /** Tempo (BPM) */
  tempo?: number;
  
  /** Time signature */
  timeSignature?: {
    numerator: number;
    denominator: number;
  };
  
  /** Key signature (e.g., "C", "Am") */
  key?: string;
  
  /** Number of tracks */
  trackCount?: number;
}

/**
 * MIDI object (extends MusicalObject with MIDI-specific metadata)
 */
export interface MidiObject extends MusicalObject {
  type: ObjectType.Midi;
  metadata: MidiMetadata & Record<string, unknown>;
}

/**
 * Stem separation metadata
 */
export interface StemsMetadata {
  /** Original audio object ID */
  originalAudioId?: string;
  
  /** Separation model used (e.g., "demucs") */
  model?: string;
  
  /** Number of stems generated */
  stemCount?: number;
}

/**
 * Stems container object (has audio children)
 */
export interface StemsObject extends MusicalObject {
  type: ObjectType.Stems;
  metadata: StemsMetadata & Record<string, unknown>;
  children: AudioObject[];
}

/**
 * Type guard: Check if object is AudioObject
 */
export function isAudioObject(obj: MusicalObject): obj is AudioObject {
  return obj.type === ObjectType.Audio;
}

/**
 * Type guard: Check if object is MidiObject
 */
export function isMidiObject(obj: MusicalObject): obj is MidiObject {
  return obj.type === ObjectType.Midi;
}

/**
 * Type guard: Check if object is StemsObject
 */
export function isStemsObject(obj: MusicalObject): obj is StemsObject {
  return obj.type === ObjectType.Stems;
}
