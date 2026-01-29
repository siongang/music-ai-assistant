/**
 * Job Adapters
 * 
 * Converts job-related DTOs to simpler app domain types.
 */

import type { JobDTO } from '@/api-client/types';
import { JobStatus as ApiJobStatus } from '@/api-client/types';

/**
 * Simplified job status for UI display
 */
export interface JobStatusInfo {
  /** Job ID */
  id: string;
  
  /** Job type (user-friendly) */
  type: string;
  
  /** Current status */
  status: ApiJobStatus;
  
  /** Progress (0-1, or null if unknown) */
  progress: number | null;
  
  /** Error message if failed */
  error?: string;
  
  /** Is the job complete (succeeded or failed) */
  isComplete: boolean;
  
  /** Is the job running */
  isRunning: boolean;
  
  /** Is the job failed */
  isFailed: boolean;
  
  /** Is the job succeeded */
  isSucceeded: boolean;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date | null;
}

/**
 * Convert JobDTO to simplified JobStatusInfo
 * 
 * This creates a simpler representation for UI components.
 * 
 * @param job - Job DTO from API
 * @returns Simplified job status info
 * 
 * @example
 * ```ts
 * const job = await getJob(jobId);
 * const statusInfo = jobToStatusInfo(job);
 * 
 * if (statusInfo.isComplete) {
 *   console.log('Job finished!');
 * }
 * ```
 */
export function jobToStatusInfo(job: JobDTO): JobStatusInfo {
  const isComplete = 
    job.status === ApiJobStatus.Succeeded || 
    job.status === ApiJobStatus.Failed;
  
  const isRunning = job.status === ApiJobStatus.Running;
  const isFailed = job.status === ApiJobStatus.Failed;
  const isSucceeded = job.status === ApiJobStatus.Succeeded;

  return {
    id: job.job_id,
    type: formatJobType(job.type),
    status: job.status,
    progress: job.progress ?? null,
    error: job.error_message || undefined,
    isComplete,
    isRunning,
    isFailed,
    isSucceeded,
    createdAt: new Date(job.created_at),
    updatedAt: job.updated_at ? new Date(job.updated_at) : null,
  };
}

/**
 * Format job type for display
 * 
 * Converts API job type strings to user-friendly names.
 * 
 * @param jobType - Job type from API
 * @returns Human-readable job type
 */
export function formatJobType(jobType: string): string {
  const typeMap: Record<string, string> = {
    'stem_separation': 'Stem Separation',
    'midi_conversion': 'Audio to MIDI',
    'melody_extraction': 'Melody Extraction',
    'chord_analysis': 'Chord Analysis',
  };
  
  return typeMap[jobType] || jobType;
}

/**
 * Format job status for display
 * 
 * @param status - Job status from API
 * @returns User-friendly status text
 */
export function formatJobStatus(status: ApiJobStatus): string {
  const statusMap: Record<ApiJobStatus, string> = {
    [ApiJobStatus.Queued]: 'Queued',
    [ApiJobStatus.Running]: 'Processing',
    [ApiJobStatus.Succeeded]: 'Complete',
    [ApiJobStatus.Failed]: 'Failed',
  };
  
  return statusMap[status] || status;
}

/**
 * Format progress as percentage string
 * 
 * @param progress - Progress value (0-1)
 * @returns Percentage string (e.g., "75%")
 */
export function formatProgress(progress: number | null | undefined): string {
  if (progress === null || progress === undefined) {
    return '0%';
  }
  
  return `${Math.round(progress * 100)}%`;
}

/**
 * Calculate estimated time remaining
 * 
 * @param job - Job DTO
 * @returns Estimated seconds remaining, or null if unknown
 */
export function estimateTimeRemaining(job: JobDTO): number | null {
  // If no progress, can't estimate
  if (!job.progress || job.progress === 0) {
    return null;
  }
  
  // Calculate elapsed time
  const createdAt = new Date(job.created_at).getTime();
  const now = Date.now();
  const elapsedMs = now - createdAt;
  
  // Estimate total time based on progress
  const totalMs = elapsedMs / job.progress;
  const remainingMs = totalMs - elapsedMs;
  
  return Math.round(remainingMs / 1000); // Return seconds
}

/**
 * Format time remaining as human-readable string
 * 
 * @param seconds - Seconds remaining
 * @returns Human-readable time string
 */
export function formatTimeRemaining(seconds: number | null): string {
  if (seconds === null || seconds <= 0) {
    return 'Unknown';
  }
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get status color for UI
 * 
 * @param status - Job status
 * @returns Tailwind color class
 */
export function getStatusColor(status: ApiJobStatus): string {
  const colorMap: Record<ApiJobStatus, string> = {
    [ApiJobStatus.Queued]: 'text-gray-500',
    [ApiJobStatus.Running]: 'text-blue-500',
    [ApiJobStatus.Succeeded]: 'text-green-500',
    [ApiJobStatus.Failed]: 'text-red-500',
  };
  
  return colorMap[status] || 'text-gray-500';
}

/**
 * Batch convert multiple jobs to status info
 * 
 * @param jobs - Array of job DTOs
 * @returns Array of status info objects
 */
export function batchJobsToStatusInfo(jobs: JobDTO[]): JobStatusInfo[] {
  return jobs.map(jobToStatusInfo);
}
