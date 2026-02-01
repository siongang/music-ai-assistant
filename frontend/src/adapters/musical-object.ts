/**
 * Musical Object Adapters
 * 
 * Converts API DTOs to MusicalObject domain models.
 * These adapters decouple the API shape from the app logic.
 */

import type { JobDTO } from '@/api-client/types';
import type {
  MusicalObject,
  AudioObject,
  AudioMetadata,
  MidiObject,
  StemsObject,
} from '@/types';
import { ObjectType } from '@/types';

/**
 * Convert JobDTO to MusicalObject
 * 
 * This is the primary adapter for converting backend job results
 * into app domain objects that can be added to the object tree.
 * 
 * @param job - Job DTO from backend
 * @returns MusicalObject based on job type and output
 * 
 * @example
 * ```ts
 * const job = await getJob(jobId);
 * const musicalObject = jobToMusicalObject(job);
 * // Add to object tree
 * ```
 */
export function jobToMusicalObject(job: JobDTO): MusicalObject {
  const now = new Date();
  const baseObject = {
    id: job.job_id,
    createdAt: new Date(job.created_at),
    updatedAt: job.updated_at ? new Date(job.updated_at) : now,
  };

  // Handle different job types
  switch (job.type) {
    case 'stem_separation':
      return jobToStemsObject(job, baseObject);
    
    case 'midi_conversion':
      return jobToMidiObject(job, baseObject);
    
    case 'melody_extraction':
      return jobToMidiObject(job, baseObject); // Similar to MIDI
    
    default:
      // Fallback: create a generic audio object
      return {
        ...baseObject,
        name: `Job ${job.job_id}`,
        type: ObjectType.Audio,
        parentId: null,
        children: [],
        metadata: {
          jobId: job.job_id,
          jobType: job.type,
          output: job.output || {},
        },
      };
  }
}

/**
 * Convert stem separation job to StemsObject
 */
function jobToStemsObject(
  job: JobDTO,
  baseObject: Pick<MusicalObject, 'id' | 'createdAt' | 'updatedAt'>
): StemsObject {
  // Extract stem file paths from job output
  // Backend returns: { vocals: "path/to/vocals.mp3", drums: "...", ... }
  const output = job.output || {};
  const stemNames = ['vocals', 'drums', 'bass', 'other'];
  
  // Create child AudioObject for each stem
  const children: AudioObject[] = stemNames
    .filter(name => output[name]) // Only include stems that exist
    .map(name => ({
      id: `${job.job_id}-${name}`,
      name: `${name}.mp3`,
      type: ObjectType.Audio,
      parentId: job.job_id,
      children: [],
      metadata: {
        filePath: String(output[name]),
        stemType: name,
        originalJobId: job.job_id,
      },
      createdAt: baseObject.createdAt,
      updatedAt: baseObject.updatedAt,
    }));

  // Extract model parameter safely
  const modelParam = job.params?.model;
  const model = typeof modelParam === 'string' && modelParam ? modelParam : 'demucs';
  
  return {
    ...baseObject,
    name: `stems_${job.audio_id}`,
    type: ObjectType.Stems,
    parentId: null, // Will be set when added to tree
    children,
    metadata: {
      originalAudioId: job.audio_id,
      model,
      stemCount: children.length,
      jobId: job.job_id,
    },
  };
}

/**
 * Convert MIDI conversion job to MidiObject
 */
function jobToMidiObject(
  job: JobDTO,
  baseObject: Pick<MusicalObject, 'id' | 'createdAt' | 'updatedAt'>
): MidiObject {
  const output = job.output || {};
  const midiPath = output.midi || output.melody;
  const filePath = typeof midiPath === 'string' ? midiPath : '';

  return {
    ...baseObject,
    name: String(output.filename || `midi_${job.audio_id}.mid`),
    type: ObjectType.Midi,
    parentId: null, // Will be set when added to tree
    children: [],
    metadata: {
      filePath,
      tempo: typeof output.tempo === 'number' ? output.tempo : undefined,
      key: typeof output.key === 'string' ? output.key : undefined,
      timeSignature: output.timeSignature as { numerator: number; denominator: number } | undefined,
      jobId: job.job_id,
    },
  };
}

/**
 * Convert MusicalObject to API format
 * 
 * This is used when we need to send app objects back to the API
 * (less common, but included for completeness).
 * 
 * @param object - MusicalObject from app
 * @returns API-compatible object format
 */
export function musicalObjectToApi(object: MusicalObject): Record<string, unknown> {
  return {
    id: object.id,
    name: object.name,
    type: object.type,
    parent_id: object.parentId,
    metadata: object.metadata,
    created_at: object.createdAt.toISOString(),
    updated_at: object.updatedAt.toISOString(),
  };
}

/**
 * API object shape stored in tree snapshot (matches musicalObjectToApi output)
 */
export interface ApiTreeObject {
  id: string;
  name: string;
  type: string;
  parent_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Convert API tree object to MusicalObject (for loading tree from backend)
 */
export function apiObjectToMusicalObject(obj: ApiTreeObject): MusicalObject {
  const type =
    typeof obj.type === 'string' && Object.values(ObjectType).includes(obj.type as ObjectType)
      ? (obj.type as ObjectType)
      : ObjectType.Audio;
  return {
    id: obj.id,
    name: obj.name,
    type,
    parentId: obj.parent_id,
    children: [],
    metadata: obj.metadata ?? {},
    createdAt: new Date(obj.created_at),
    updatedAt: new Date(obj.updated_at),
  };
}

/**
 * Convert audio upload response to AudioObject
 * 
 * @param audioId - Audio ID from upload response
 * @param filename - Filename from upload response
 * @returns AudioObject ready to add to tree
 * 
 * @example
 * ```ts
 * const response = await uploadAudio(file);
 * const audioObj = audioUploadToObject(response.audio_id, response.filename);
 * ```
 */
export function audioUploadToObject(
  audioId: string,
  filename: string
): AudioObject {
  const now = new Date();
  
  return {
    id: audioId,
    name: filename,
    type: ObjectType.Audio,
    parentId: null,
    children: [],
    metadata: {
      filePath: `audio/${audioId}/${filename}`,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Extract file paths from MusicalObject
 * 
 * Helper to get all downloadable file paths from an object.
 * Useful for displaying download links or loading audio.
 * 
 * @param object - MusicalObject
 * @returns Array of file paths
 */
export function extractFilePaths(object: MusicalObject): string[] {
  const paths: string[] = [];
  
  // Add object's own file path if it exists
  const filePath = object.metadata.filePath;
  if (typeof filePath === 'string') {
    paths.push(filePath);
  }
  
  // Recursively add children's file paths
  for (const child of object.children) {
    paths.push(...extractFilePaths(child));
  }
  
  return paths;
}

/**
 * Check if a MusicalObject has downloadable content
 * 
 * @param object - MusicalObject
 * @returns true if object has file paths
 */
export function hasDownloadableContent(object: MusicalObject): boolean {
  return extractFilePaths(object).length > 0;
}
