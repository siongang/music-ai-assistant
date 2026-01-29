/**
 * Project Adapters
 * 
 * Converts project-related DTOs between API and app formats.
 */

import type { Project, TimeSignature } from '@/types';

/**
 * API Project DTO (as it might come from backend)
 * 
 * Note: The backend doesn't currently have a projects endpoint,
 * so this is a placeholder for future implementation.
 */
export interface ApiProject {
  id: string;
  name: string;
  tempo?: number;
  key?: string;
  time_signature?: {
    numerator: number;
    denominator: number;
  };
  root_object_id?: string | null;
  description?: string;
  thumbnail?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Convert API project to app Project
 * 
 * Transforms snake_case API format to camelCase app format.
 * Provides sensible defaults for missing values.
 * 
 * @param apiProject - Project from API
 * @returns App domain Project
 */
export function apiProjectToProject(apiProject: ApiProject): Project {
  return {
    id: apiProject.id,
    name: apiProject.name,
    tempo: apiProject.tempo || 120,
    key: apiProject.key || 'C',
    timeSignature: apiProject.time_signature || { numerator: 4, denominator: 4 },
    rootObject: null, // Loaded separately via object tree
    description: apiProject.description,
    thumbnail: apiProject.thumbnail,
    createdAt: new Date(apiProject.created_at),
    updatedAt: new Date(apiProject.updated_at),
  };
}

/**
 * Convert app Project to API format
 * 
 * Transforms camelCase app format to snake_case API format.
 * 
 * @param project - App domain Project
 * @returns API-compatible project object
 */
export function projectToApiProject(project: Project): ApiProject {
  return {
    id: project.id,
    name: project.name,
    tempo: project.tempo,
    key: project.key,
    time_signature: {
      numerator: project.timeSignature.numerator,
      denominator: project.timeSignature.denominator,
    },
    root_object_id: project.rootObject?.id || null,
    description: project.description,
    thumbnail: project.thumbnail,
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
  };
}

/**
 * Create a new project with defaults
 * 
 * Useful for creating new projects in the UI.
 * 
 * @param name - Project name
 * @param options - Optional project settings
 * @returns New Project object
 */
export function createProject(
  name: string,
  options?: {
    tempo?: number;
    key?: string;
    timeSignature?: TimeSignature;
    description?: string;
  }
): Omit<Project, 'id'> {
  const now = new Date();
  
  return {
    name,
    tempo: options?.tempo || 120,
    key: options?.key || 'C',
    timeSignature: options?.timeSignature || { numerator: 4, denominator: 4 },
    rootObject: null,
    description: options?.description,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validate project name
 * 
 * @param name - Project name to validate
 * @returns Error message if invalid, null if valid
 */
export function validateProjectName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Project name is required';
  }
  
  if (name.length > 100) {
    return 'Project name must be less than 100 characters';
  }
  
  // Check for invalid characters
  if (/[<>:"/\\|?*]/.test(name)) {
    return 'Project name contains invalid characters';
  }
  
  return null;
}

/**
 * Validate tempo
 * 
 * @param tempo - Tempo in BPM
 * @returns Error message if invalid, null if valid
 */
export function validateTempo(tempo: number): string | null {
  if (tempo < 20) {
    return 'Tempo must be at least 20 BPM';
  }
  
  if (tempo > 300) {
    return 'Tempo must be less than 300 BPM';
  }
  
  return null;
}

/**
 * Validate key signature
 * 
 * @param key - Key signature (e.g., "C", "Am", "F#")
 * @returns Error message if invalid, null if valid
 */
export function validateKey(key: string): string | null {
  const validKeys = [
    'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm',
  ];
  
  if (!validKeys.includes(key)) {
    return 'Invalid key signature';
  }
  
  return null;
}

/**
 * Format time signature as string
 * 
 * @param timeSignature - Time signature object
 * @returns Formatted string (e.g., "4/4")
 */
export function formatTimeSignature(timeSignature: TimeSignature): string {
  return `${timeSignature.numerator}/${timeSignature.denominator}`;
}

/**
 * Parse time signature from string
 * 
 * @param str - Time signature string (e.g., "4/4")
 * @returns TimeSignature object, or null if invalid
 */
export function parseTimeSignature(str: string): TimeSignature | null {
  const match = str.match(/^(\d+)\/(\d+)$/);
  
  if (!match) {
    return null;
  }
  
  const numerator = parseInt(match[1], 10);
  const denominator = parseInt(match[2], 10);
  
  // Validate values
  if (numerator < 1 || numerator > 16) {
    return null;
  }
  
  if (![2, 4, 8, 16].includes(denominator)) {
    return null;
  }
  
  return { numerator, denominator };
}
