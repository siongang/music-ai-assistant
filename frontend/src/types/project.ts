/**
 * Project Types
 * 
 * A Project is the top-level container that owns:
 * - The object tree (all musical objects)
 * - Project-wide settings (tempo, key, time signature)
 * - Metadata (name, creation date, etc.)
 */

import type { MusicalObject } from './musical-object';

/**
 * Time signature representation
 */
export interface TimeSignature {
  /** Top number (beats per measure) */
  numerator: number;
  
  /** Bottom number (note value that gets the beat) */
  denominator: number;
}

/**
 * Project interface
 * Represents a single music project workspace
 */
export interface Project {
  /** Unique project identifier */
  id: string;
  
  /** Project name */
  name: string;
  
  /** Tempo in BPM (beats per minute) */
  tempo: number;
  
  /** Key signature (e.g., "Am", "C#", "Bb") */
  key: string;
  
  /** Time signature (e.g., { numerator: 4, denominator: 4 } for 4/4) */
  timeSignature: TimeSignature;
  
  /** Root of the object tree (null for empty project) */
  rootObject: MusicalObject | null;
  
  /** Project creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Optional project description */
  description?: string;
  
  /** Optional thumbnail/cover image URL */
  thumbnail?: string;
}

/**
 * Project creation parameters
 */
export interface CreateProjectParams {
  /** Project name */
  name: string;
  
  /** Optional tempo (defaults to 120 BPM) */
  tempo?: number;
  
  /** Optional key (defaults to "C") */
  key?: string;
  
  /** Optional time signature (defaults to 4/4) */
  timeSignature?: TimeSignature;
  
  /** Optional description */
  description?: string;
}

/**
 * Project update parameters
 */
export interface UpdateProjectParams {
  /** Updated name */
  name?: string;
  
  /** Updated tempo */
  tempo?: number;
  
  /** Updated key */
  key?: string;
  
  /** Updated time signature */
  timeSignature?: TimeSignature;
  
  /** Updated description */
  description?: string;
  
  /** Updated thumbnail URL */
  thumbnail?: string;
}

/**
 * Project list item (minimal data for project list view)
 */
export interface ProjectListItem {
  /** Project ID */
  id: string;
  
  /** Project name */
  name: string;
  
  /** Thumbnail URL */
  thumbnail?: string;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Creation timestamp */
  createdAt: Date;
}
