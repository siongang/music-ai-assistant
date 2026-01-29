/**
 * Object Tree Hook
 * 
 * Convenience hook for accessing the object tree store.
 * Provides commonly used selectors and actions.
 */

import { useObjectTreeStore } from '../store/object-tree-store';
import type { MusicalObject } from '@/types';

/**
 * Use object tree hook
 * 
 * Provides access to the object tree state and actions.
 * 
 * @returns Object tree state and actions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { objects, addObject, selectObject } = useObjectTree();
 *   
 *   return (
 *     <div>
 *       {Object.values(objects).map(obj => (
 *         <div key={obj.id} onClick={() => selectObject(obj.id)}>
 *           {obj.name}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useObjectTree() {
  const objects = useObjectTreeStore(state => state.objects);
  const rootId = useObjectTreeStore(state => state.rootId);
  const selectedIds = useObjectTreeStore(state => state.selectedIds);
  
  const addObject = useObjectTreeStore(state => state.addObject);
  const removeObject = useObjectTreeStore(state => state.removeObject);
  const updateObject = useObjectTreeStore(state => state.updateObject);
  const selectObject = useObjectTreeStore(state => state.selectObject);
  const clearSelection = useObjectTreeStore(state => state.clearSelection);
  const toggleSelection = useObjectTreeStore(state => state.toggleSelection);
  
  const getObject = useObjectTreeStore(state => state.getObject);
  const getChildren = useObjectTreeStore(state => state.getChildren);
  const getRootObjects = useObjectTreeStore(state => state.getRootObjects);
  const getSelectedObjects = useObjectTreeStore(state => state.getSelectedObjects);
  const isSelected = useObjectTreeStore(state => state.isSelected);
  const getPath = useObjectTreeStore(state => state.getPath);
  const clearAll = useObjectTreeStore(state => state.clearAll);
  
  return {
    // State
    objects,
    rootId,
    selectedIds,
    
    // Actions
    addObject,
    removeObject,
    updateObject,
    selectObject,
    clearSelection,
    toggleSelection,
    
    // Queries
    getObject,
    getChildren,
    getRootObjects,
    getSelectedObjects,
    isSelected,
    getPath,
    clearAll,
  };
}

/**
 * Use root objects hook
 * 
 * Gets all root-level objects (objects with no parent).
 * 
 * @returns Array of root objects
 */
export function useRootObjects(): MusicalObject[] {
  return useObjectTreeStore(state => state.getRootObjects());
}

/**
 * Use selected objects hook
 * 
 * Gets all currently selected objects.
 * 
 * @returns Array of selected objects
 */
export function useSelectedObjects(): MusicalObject[] {
  return useObjectTreeStore(state => state.getSelectedObjects());
}

/**
 * Use object hook
 * 
 * Gets a specific object by ID.
 * 
 * @param id - Object ID
 * @returns Object or null if not found
 */
export function useObject(id: string | null): MusicalObject | null {
  return useObjectTreeStore(state => 
    id ? state.getObject(id) : null
  );
}

/**
 * Use children hook
 * 
 * Gets all children of a specific object.
 * 
 * @param parentId - Parent object ID
 * @returns Array of child objects
 */
export function useChildren(parentId: string | null): MusicalObject[] {
  return useObjectTreeStore(state => 
    parentId ? state.getChildren(parentId) : []
  );
}

/**
 * Use is selected hook
 * 
 * Checks if a specific object is selected.
 * 
 * @param id - Object ID
 * @returns true if selected
 */
export function useIsSelected(id: string): boolean {
  return useObjectTreeStore(state => state.isSelected(id));
}

/**
 * Use object path hook
 * 
 * Gets the full hierarchy path to an object.
 * 
 * @param id - Object ID
 * @returns Array of objects from root to target
 */
export function useObjectPath(id: string | null): MusicalObject[] {
  return useObjectTreeStore(state => 
    id ? state.getPath(id) : []
  );
}

/**
 * Use object count hook
 * 
 * Gets the total number of objects in the tree.
 * 
 * @returns Number of objects
 */
export function useObjectCount(): number {
  return useObjectTreeStore(state => Object.keys(state.objects).length);
}

/**
 * Use selection count hook
 * 
 * Gets the number of selected objects.
 * 
 * @returns Number of selected objects
 */
export function useSelectionCount(): number {
  return useObjectTreeStore(state => state.selectedIds.length);
}

/**
 * Use has selection hook
 * 
 * Checks if any objects are selected.
 * 
 * @returns true if any objects are selected
 */
export function useHasSelection(): boolean {
  return useObjectTreeStore(state => state.selectedIds.length > 0);
}
