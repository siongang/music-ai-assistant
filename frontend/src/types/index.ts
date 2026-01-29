/**
 * Core Types Index
 * 
 * Re-exports all type definitions for easy importing throughout the app.
 * 
 * Usage:
 *   import { MusicalObject, Project, Tool, ViewMode } from '@/types'
 */

// Musical Object types
export type {
  MusicalObject,
  AudioObject,
  MidiObject,
  StemsObject,
  AudioMetadata,
  MidiMetadata,
  StemsMetadata,
} from './musical-object';

export {
  ObjectType,
  isAudioObject,
  isMidiObject,
  isStemsObject,
} from './musical-object';

// Project types
export type {
  Project,
  TimeSignature,
  CreateProjectParams,
  UpdateProjectParams,
  ProjectListItem,
} from './project';

// Tool types
export type {
  Tool,
  ToolRegistry,
  ToolExecutionResult,
} from './tool';

export {
  ToolType,
  ToolExecutionStatus,
} from './tool';

// View types
export type {
  ViewConfig,
  WaveformViewSettings,
  MidiViewSettings,
  SheetViewSettings,
  TrackDisplayConfig,
  TimelineConfig,
} from './view';

export {
  ViewMode,
} from './view';
