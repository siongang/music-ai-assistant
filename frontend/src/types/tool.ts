/**
 * Tool Types
 * 
 * Tools are modular operations that transform MusicalObjects.
 * They are registered in a registry and can be invoked contextually
 * (e.g., right-click menu) or via command palette.
 */

import type { MusicalObject, ObjectType } from './musical-object';

/**
 * Available tool types
 */
export enum ToolType {
  /** Separate audio into stems (vocals, bass, drums, other) */
  SeparateStems = 'separate_stems',
  
  /** Convert audio to MIDI */
  ConvertToMidi = 'convert_to_midi',
  
  /** Analyze audio to detect key signature */
  AnalyzeKey = 'analyze_key',
}

/**
 * Tool execution status
 */
export enum ToolExecutionStatus {
  /** Tool is currently running */
  Running = 'running',
  
  /** Tool completed successfully */
  Success = 'success',
  
  /** Tool failed with an error */
  Failed = 'failed',
  
  /** Tool was cancelled by user */
  Cancelled = 'cancelled',
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  /** Execution status */
  status: ToolExecutionStatus;
  
  /** New musical object(s) created by the tool */
  output?: MusicalObject | MusicalObject[];
  
  /** Error message (if status is Failed) */
  error?: string;
  
  /** Progress percentage (0-100) */
  progress?: number;
  
  /** Job ID for tracking backend execution */
  jobId?: string;
}

/**
 * Tool definition interface
 * Each tool registers itself with this structure
 */
export interface Tool {
  /** Unique tool identifier */
  id: string;
  
  /** Tool name (displayed in UI) */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Icon name or emoji */
  icon: string;
  
  /** Object types this tool can accept as input */
  inputTypes: ObjectType[];
  
  /** Object type this tool produces as output */
  outputType: ObjectType;
  
  /** Tool execution function */
  execute: (
    input: MusicalObject,
    params?: Record<string, unknown>
  ) => Promise<ToolExecutionResult>;
  
  /** Optional: Validate if tool can be applied to specific object */
  canExecute?: (input: MusicalObject) => boolean;
  
  /** Optional: Get tool-specific parameters UI */
  getParams?: () => Record<string, unknown>;
}

/**
 * Tool registry interface
 */
export interface ToolRegistry {
  /** Register a new tool */
  register(tool: Tool): void;
  
  /** Get tool by ID */
  getTool(id: string): Tool | undefined;
  
  /** Get all registered tools */
  getAllTools(): Tool[];
  
  /** Get tools applicable to a specific object */
  getToolsForObject(object: MusicalObject): Tool[];
}
