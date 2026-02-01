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
 * Create a new job in a project
 *
 * POST /projects/{project_id}/jobs
 */
export async function createJob(
  projectId: string,
  jobData: JobCreateRequest
): Promise<JobDTO> {
  return apiClient.post<JobDTO>(`/projects/${projectId}/jobs`, jobData);
}

/**
 * Get job status by ID (project-scoped)
 *
 * GET /projects/{project_id}/jobs/{job_id}
 */
export async function getJob(projectId: string, jobId: string): Promise<JobDTO> {
  return apiClient.get<JobDTO>(`/projects/${projectId}/jobs/${jobId}`);
}

/**
 * List jobs for a project with optional filtering
 *
 * GET /projects/{project_id}/jobs?status=...&limit=...&offset=...
 */
export async function listJobs(
  projectId: string,
  options?: {
    status?: JobStatus | string;
    jobType?: JobType | string;
    limit?: number;
    offset?: number;
  }
): Promise<JobDTO[]> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.jobType) params.append('job_type', options.jobType);
  if (options?.limit !== undefined) params.append('limit', String(options.limit));
  if (options?.offset !== undefined) params.append('offset', String(options.offset));
  const query = params.toString();
  const endpoint = query
    ? `/projects/${projectId}/jobs?${query}`
    : `/projects/${projectId}/jobs`;
  return apiClient.get<JobDTO[]>(endpoint);
}

/**
 * Poll a job until it completes (succeeds or fails)
 *
 * @param projectId - Project ID
 * @param jobId - Job ID to poll
 */
export async function pollJobUntilComplete(
  projectId: string,
  jobId: string,
  options?: {
    interval?: number;
    maxAttempts?: number;
    onProgress?: (job: JobDTO) => void;
    signal?: AbortSignal;
  }
): Promise<JobDTO> {
  const interval = options?.interval || DEFAULT_POLL_INTERVAL;
  const maxAttempts = options?.maxAttempts || MAX_POLL_ATTEMPTS;
  const onProgress = options?.onProgress;
  const signal = options?.signal;

  let attempts = 0;

  while (attempts < maxAttempts) {
    if (signal?.aborted) throw new Error('Polling cancelled');

    const job = await getJob(projectId, jobId);
    if (onProgress) onProgress(job);

    if (job.status === JobStatus.Succeeded) return job;
    if (job.status === JobStatus.Failed) {
      throw new Error(job.error_message || 'Job failed');
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error(`Job polling exceeded maximum attempts (${maxAttempts})`);
}

/**
 * Helper: Create a stem separation job in a project and wait for completion
 *
 * @param projectId - Project ID
 * @param audioId - Audio ID to separate
 * @param onProgress - Optional progress callback
 */
export async function separateStemsAndWait(
  projectId: string,
  audioId: string,
  onProgress?: (job: JobDTO) => void
): Promise<JobDTO> {
  const job = await createJob(projectId, {
    type: JobType.StemSeparation,
    input: { audio_id: audioId },
  });
  return pollJobUntilComplete(projectId, job.job_id, { onProgress });
}
