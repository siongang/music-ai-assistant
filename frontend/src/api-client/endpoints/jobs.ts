/**
 * Jobs API Endpoints
 * 
 * Typed functions for job-related API calls.
 */

import { apiClient } from '../client';
import {
  JobDTO,
  JobCreateRequest,
  JobType,
  JobStatus,
} from '../types';
import { DEFAULT_POLL_INTERVAL, MAX_POLL_ATTEMPTS } from '../config';

/**
 * Create a new job
 * 
 * POST /jobs
 * 
 * @param jobData - Job creation data
 * @returns JobDTO with job details
 * 
 * @example
 * ```ts
 * const job = await createJob({
 *   type: JobType.StemSeparation,
 *   input: { audio_id: 'audio-uuid' },
 *   params: { model: 'demucs' }
 * });
 * ```
 */
export async function createJob(jobData: JobCreateRequest): Promise<JobDTO> {
  return apiClient.post<JobDTO>('/jobs', jobData);
}

/**
 * Get job status by ID
 * 
 * GET /jobs/{job_id}
 * 
 * @param jobId - UUID of the job
 * @returns JobDTO with job details
 */
export async function getJob(jobId: string): Promise<JobDTO> {
  return apiClient.get<JobDTO>(`/jobs/${jobId}`);
}

/**
 * List all jobs with optional filtering
 * 
 * GET /jobs?status=...&job_type=...&limit=...&offset=...
 * 
 * @param options - Filter and pagination options
 * @returns Array of JobDTO objects
 * 
 * @example
 * ```ts
 * const jobs = await listJobs({
 *   status: JobStatus.Succeeded,
 *   limit: 20
 * });
 * ```
 */
export async function listJobs(options?: {
  status?: JobStatus | string;
  jobType?: JobType | string;
  limit?: number;
  offset?: number;
}): Promise<JobDTO[]> {
  const params = new URLSearchParams();
  
  if (options?.status) {
    params.append('status', options.status);
  }
  if (options?.jobType) {
    params.append('job_type', options.jobType);
  }
  if (options?.limit !== undefined) {
    params.append('limit', options.limit.toString());
  }
  if (options?.offset !== undefined) {
    params.append('offset', options.offset.toString());
  }
  
  const queryString = params.toString();
  const endpoint = queryString ? `/jobs?${queryString}` : '/jobs';
  
  return apiClient.get<JobDTO[]>(endpoint);
}

/**
 * Poll a job until it completes (succeeds or fails)
 * 
 * This is a convenience function that repeatedly calls getJob()
 * until the job reaches a terminal state.
 * 
 * @param jobId - UUID of the job to poll
 * @param options - Polling options
 * @returns Final JobDTO when job completes
 * 
 * @throws Error if max attempts exceeded or job fails
 * 
 * @example
 * ```ts
 * const job = await createJob({ ... });
 * const completedJob = await pollJobUntilComplete(job.job_id, {
 *   onProgress: (job) => console.log(`Progress: ${job.progress}%`)
 * });
 * ```
 */
export async function pollJobUntilComplete(
  jobId: string,
  options?: {
    /** Polling interval in milliseconds (default: 2000) */
    interval?: number;
    
    /** Maximum number of attempts (default: 150) */
    maxAttempts?: number;
    
    /** Callback for progress updates */
    onProgress?: (job: JobDTO) => void;
    
    /** AbortSignal for cancellation */
    signal?: AbortSignal;
  }
): Promise<JobDTO> {
  const interval = options?.interval || DEFAULT_POLL_INTERVAL;
  const maxAttempts = options?.maxAttempts || MAX_POLL_ATTEMPTS;
  const onProgress = options?.onProgress;
  const signal = options?.signal;
  
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Check for cancellation
    if (signal?.aborted) {
      throw new Error('Polling cancelled');
    }
    
    // Get job status
    const job = await getJob(jobId);
    
    // Call progress callback
    if (onProgress) {
      onProgress(job);
    }
    
    // Check if job is complete
    if (job.status === JobStatus.Succeeded) {
      return job;
    }
    
    if (job.status === JobStatus.Failed) {
      throw new Error(job.error_message || 'Job failed');
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }
  
  throw new Error(`Job polling exceeded maximum attempts (${maxAttempts})`);
}

/**
 * Helper: Create a stem separation job and wait for completion
 * 
 * @param audioId - UUID of the audio to separate
 * @param onProgress - Optional progress callback
 * @returns Completed JobDTO with stem file paths in output
 * 
 * @example
 * ```ts
 * const result = await separateStemsAndWait('audio-uuid', (job) => {
 *   console.log(`Progress: ${job.progress * 100}%`);
 * });
 * 
 * // Access stem file paths
 * const vocals = result.output.vocals; // e.g., "jobs/xxx/stems/vocals.mp3"
 * ```
 */
export async function separateStemsAndWait(
  audioId: string,
  onProgress?: (job: JobDTO) => void
): Promise<JobDTO> {
  // Create job
  const job = await createJob({
    type: JobType.StemSeparation,
    input: { audio_id: audioId },
  });
  
  // Poll until complete
  return pollJobUntilComplete(job.job_id, { onProgress });
}
