/**
 * Object Tree State Management
 * 
 * Zustand store for managing the hierarchical musical object tree.
 * This is the single source of truth for all objects in the project.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { MusicalObject } from '@/types';

/**
 * Object Tree State
 */
interface ObjectTreeState {
  /** Flat map of all objects (id → object) for O(1) lookup */
  objects: Record<string, MusicalObject>;
  
  /** Root object ID (top-level project container) */
  rootId: string | null;
  
  /** Currently selected object IDs */
  selectedIds: string[];
}

/**
 * Object Tree Actions
 */
interface ObjectTreeActions {
  /**
   * Add a new object to the tree
   * 
   * @param object - Object to add
   * @param parentId - Optional parent ID (null for root objects)
   */
  addObject: (object: MusicalObject, parentId?: string | null) => void;
  
  /**
   * Remove an object and all its children
   * 
   * @param id - Object ID to remove
   */
  removeObject: (id: string) => void;
  
  /**
   * Update an object's properties
   * 
   * @param id - Object ID to update
   * @param updates - Partial updates to apply
   */
  updateObject: (id: string, updates: Partial<MusicalObject>) => void;
  
  /**
   * Select an object
   * 
   * @param id - Object ID to select
   * @param multi - If true, add to selection (multi-select)
   */
  selectObject: (id: string, multi?: boolean) => void;
  
  /**
   * Clear all selections
   */
  clearSelection: () => void;
  
  /**
   * Toggle object selection
   * 
   * @param id - Object ID to toggle
   */
  toggleSelection: (id: string) => void;
  
  /**
   * Get an object by ID
   * 
   * @param id - Object ID
   * @returns Object or null if not found
   */
  getObject: (id: string) => MusicalObject | null;
  
  /**
   * Get all children of an object
   * 
   * @param parentId - Parent object ID
   * @returns Array of child objects
   */
  getChildren: (parentId: string) => MusicalObject[];
  
  /**
   * Get all root objects (objects with no parent)
   * 
   * @returns Array of root objects
   */
  getRootObjects: () => MusicalObject[];
  
  /**
   * Get all selected objects
   * 
   * @returns Array of selected objects
   */
  getSelectedObjects: () => MusicalObject[];
  
  /**
   * Check if an object is selected
   * 
   * @param id - Object ID
   * @returns true if selected
   */
  isSelected: (id: string) => boolean;
  
  /**
   * Get the full hierarchy path to an object
   * 
   * @param id - Object ID
   * @returns Array of objects from root to target
   */
  getPath: (id: string) => MusicalObject[];
  
  /**
   * Clear all objects (reset state)
   */
  clearAll: () => void;
}

/**
 * Object Tree Store Type
 */
type ObjectTreeStore = ObjectTreeState & ObjectTreeActions;

/**
 * Initial state
 */
const initialState: ObjectTreeState = {
  objects: {},
  rootId: null,
  selectedIds: [],
};

/**
 * Object Tree Store
 * 
 * Uses Zustand with Immer middleware for immutable updates.
 */
export const useObjectTreeStore = create<ObjectTreeStore>()(
  immer((set, get) => ({
    // State
    ...initialState,

    // Actions
    addObject: (object, parentId = null) => {
      set((state) => {
        // Set parent ID
        object.parentId = parentId;
        
        // Ensure children array is empty (we derive children from parentId, not store them)
        object.children = [];
        
        // Add object to flat map
        state.objects[object.id] = object;
        
        // If no root, make this the root
        if (!state.rootId && !parentId) {
          state.rootId = object.id;
        }
        
        // Note: We don't update parent's children array anymore.
        // Children are derived on-demand via getChildren() which filters by parentId.
      });
    },

    removeObject: (id) => {
      set((state) => {
        const object = state.objects[id];
        if (!object) return;
        
        // Recursively remove all children
        const removeRecursive = (objId: string) => {
          const obj = state.objects[objId];
          if (!obj) return;
          
          // Find and remove children first (derive from parentId, not stored array)
          const children = Object.values(state.objects).filter(
            o => o.parentId === objId
          );
          
          for (const child of children) {
            removeRecursive(child.id);
          }
          
          // Remove from selection
          state.selectedIds = state.selectedIds.filter(sid => sid !== objId);
          
          // Remove from objects map
          delete state.objects[objId];
        };
        
        removeRecursive(id);
        
        // If root was removed, clear rootId
        if (state.rootId === id) {
          state.rootId = null;
        }
      });
    },

    updateObject: (id, updates) => {
      set((state) => {
        const object = state.objects[id];
        if (!object) return;
        
        // Apply updates (except children array - we don't store that)
        const { children, ...safeUpdates } = updates as Partial<MusicalObject> & { children?: MusicalObject[] };
        Object.assign(object, safeUpdates);
        object.updatedAt = new Date();
        
        // Note: If parentId changed, the relationship is automatically updated
        // because getChildren() derives children from parentId at query time.
      });
    },

    selectObject: (id, multi = false) => {
      set((state) => {
        if (!state.objects[id]) return;
        
        if (multi) {
          // Add to selection if not already selected
          if (!state.selectedIds.includes(id)) {
            state.selectedIds.push(id);
          }
        } else {
          // Replace selection
          state.selectedIds = [id];
        }
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedIds = [];
      });
    },

    toggleSelection: (id) => {
      set((state) => {
        if (!state.objects[id]) return;
        
        const index = state.selectedIds.indexOf(id);
        if (index !== -1) {
          // Remove from selection
          state.selectedIds.splice(index, 1);
        } else {
          // Add to selection
          state.selectedIds.push(id);
        }
      });
    },

    getObject: (id) => {
      return get().objects[id] || null;
    },

    getChildren: (parentId) => {
      const state = get();
      return Object.values(state.objects).filter(
        obj => obj.parentId === parentId
      );
    },

    getRootObjects: () => {
      const state = get();
      return Object.values(state.objects).filter(
        obj => obj.parentId === null
      );
    },

    getSelectedObjects: () => {
      const state = get();
      return state.selectedIds
        .map(id => state.objects[id])
        .filter(Boolean);
    },

    isSelected: (id) => {
      return get().selectedIds.includes(id);
    },

    getPath: (id) => {
      const state = get();
      const path: MusicalObject[] = [];
      let currentId: string | null = id;
      
      while (currentId) {
        const obj: MusicalObject | undefined = state.objects[currentId];
        if (!obj) break;
        
        path.unshift(obj); // Add to beginning
        currentId = obj.parentId;
      }
      
      return path;
    },

    clearAll: () => {
      set(initialState);
    },
  }))
);
