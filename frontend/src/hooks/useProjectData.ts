/**
 * Project Data Hook
 * 
 * Manages project loading, tree hydration, and persistence
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getProject, getProjectTree, putProjectTree } from '@/api-client';
import { apiProjectToProject } from '@/adapters/project';
import {
  apiObjectToMusicalObject,
  musicalObjectToApi,
  type ApiTreeObject,
} from '@/adapters/musical-object';
import { useObjectTreeStore } from '@/features/object-tree/store/object-tree-store';
import type { Project } from '@/types';

export function useProjectData(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);
  const hasHydrated = useRef(false);

  const { clearAll, addObject } = useObjectTreeStore();

  // Load project and tree
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    let cancelled = false;

    Promise.all([getProject(projectId), getProjectTree(projectId)])
      .then(([projectDto, tree]) => {
        if (cancelled) return;
        setProject(apiProjectToProject(projectDto));

        // Hydrate object-tree store
        clearAll();
        hasHydrated.current = true;
        const objs = tree.objects || {};
        
        const toApiObj = (o: Record<string, unknown>): ApiTreeObject => ({
          id: String(o.id ?? ''),
          name: String(o.name ?? ''),
          type: String(o.type ?? 'audio'),
          parent_id: o.parent_id != null ? String(o.parent_id) : null,
          metadata:
            o.metadata && typeof o.metadata === 'object' && !Array.isArray(o.metadata)
              ? (o.metadata as Record<string, unknown>)
              : {},
          created_at: String(o.created_at ?? new Date().toISOString()),
          updated_at: String(o.updated_at ?? new Date().toISOString()),
        });

        // Add all objects with their parent_id
        for (const id of Object.keys(objs)) {
          const o = objs[id];
          if (!o || typeof o !== 'object' || !('id' in o)) continue;
          const apiObj = toApiObj(o as Record<string, unknown>);
          addObject(apiObjectToMusicalObject(apiObj), apiObj.parent_id);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load project');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, clearAll, addObject]);

  // Save tree to backend
  const saveTree = useCallback(async () => {
    if (!projectId) return;
    const state = useObjectTreeStore.getState();
    const snapshot = {
      objects: Object.fromEntries(
        Object.entries(state.objects).map(([id, obj]) => [id, musicalObjectToApi(obj)])
      ),
      root_id: null,
    };
    await putProjectTree(projectId, snapshot);
    useObjectTreeStore.getState().markClean();
  }, [projectId]);

  // Save on unmount as backup
  useEffect(() => {
    return () => {
      if (!projectId || !hasHydrated.current) return;
      const state = useObjectTreeStore.getState();
      if (!state.isDirty) return;
      saveTree().catch(() => {});
    };
  }, [projectId, saveTree]);

  return {
    project,
    loading,
    error,
    saveTree,
  };
}
