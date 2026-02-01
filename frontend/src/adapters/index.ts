/**
 * Adapters Index
 * 
 * Re-exports all adapter functions for easy importing.
 * 
 * Usage:
 *   import { jobToMusicalObject, jobToStatusInfo } from '@/adapters'
 */

// Musical Object adapters
export type { ApiTreeObject } from './musical-object';
export {
  jobToMusicalObject,
  apiObjectToMusicalObject,
  musicalObjectToApi,
  audioUploadToObject,
  extractFilePaths,
  hasDownloadableContent,
} from './musical-object';

// Job adapters
export type { JobStatusInfo } from './job';
export {
  jobToStatusInfo,
  formatJobType,
  formatJobStatus,
  formatProgress,
  estimateTimeRemaining,
  formatTimeRemaining,
  getStatusColor,
  batchJobsToStatusInfo,
} from './job';

// Project adapters
export type { ApiProject, ApiProjectListItem } from './project';
export {
  apiProjectToProject,
  apiProjectListItemToProjectListItem,
  projectToApiProject,
  createProject,
  validateProjectName,
  validateTempo,
  validateKey,
  formatTimeSignature,
  parseTimeSignature,
} from './project';
