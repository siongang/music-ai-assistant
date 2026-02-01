/**
 * Projects API Endpoints
 *
 * Typed functions for project-related API calls.
 * All routes are under /projects.
 */

import { apiClient } from '../client';
import type {
  ProjectDTO,
  ProjectListItemDTO,
  TreeSnapshotDTO,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../types';

/**
 * List projects (newest first)
 *
 * GET /projects?limit=...&offset=...
 */
export async function listProjects(options?: {
  limit?: number;
  offset?: number;
}): Promise<ProjectListItemDTO[]> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) params.append('limit', String(options.limit));
  if (options?.offset !== undefined) params.append('offset', String(options.offset));
  const query = params.toString();
  const endpoint = query ? `/projects?${query}` : '/projects';
  return apiClient.get<ProjectListItemDTO[]>(endpoint);
}

/**
 * Create a new project
 *
 * POST /projects
 */
export async function createProject(body: CreateProjectRequest): Promise<ProjectDTO> {
  return apiClient.post<ProjectDTO>('/projects', body);
}

/**
 * Get a project by ID
 *
 * GET /projects/{project_id}
 */
export async function getProject(projectId: string): Promise<ProjectDTO> {
  return apiClient.get<ProjectDTO>(`/projects/${projectId}`);
}

/**
 * Update a project (partial)
 *
 * PUT /projects/{project_id}
 */
export async function updateProject(
  projectId: string,
  body: UpdateProjectRequest
): Promise<ProjectDTO> {
  return apiClient.put<ProjectDTO>(`/projects/${projectId}`, body);
}

/**
 * Delete a project
 *
 * DELETE /projects/{project_id}
 */
export async function deleteProject(projectId: string): Promise<void> {
  return apiClient.delete<void>(`/projects/${projectId}`);
}

/**
 * Get object tree snapshot for a project
 *
 * GET /projects/{project_id}/tree
 */
export async function getProjectTree(projectId: string): Promise<TreeSnapshotDTO> {
  const result = await apiClient.get<TreeSnapshotDTO | { objects: {}; root_id: null }>(
    `/projects/${projectId}/tree`
  );
  return {
    objects: result.objects ?? {},
    root_id: result.root_id ?? null,
  };
}

/**
 * Set object tree snapshot for a project
 *
 * PUT /projects/{project_id}/tree
 */
export async function putProjectTree(
  projectId: string,
  tree: TreeSnapshotDTO
): Promise<TreeSnapshotDTO> {
  return apiClient.put<TreeSnapshotDTO>(`/projects/${projectId}/tree`, tree);
}
