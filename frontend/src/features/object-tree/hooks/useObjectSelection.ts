/**
 * Object Selection Hook
 * 
 * Specialized hook for managing object selection in the tree.
 */

import { useObjectTreeStore } from '../store/object-tree-store';

/**
 * Use object selection hook
 * 
 * Provides selection-specific state and actions.
 * 
 * @returns Selection state and actions
 * 
 * @example
 * ```tsx
 * function ObjectPanel() {
 *   const {
 *     selectedObjects,
 *     selectObject,
 *     clearSelection,
 *     hasSelection
 *   } = useObjectSelection();
 *   
 *   return (
 *     <div>
 *       {hasSelection && (
 *         <button onClick={clearSelection}>
 *           Clear Selection ({selectedObjects.length})
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useObjectSelection() {
  const selectedIds = useObjectTreeStore(state => state.selectedIds);
  const selectedObjects = useObjectTreeStore(state => state.getSelectedObjects());
  
  const selectObject = useObjectTreeStore(state => state.selectObject);
  const clearSelection = useObjectTreeStore(state => state.clearSelection);
  const toggleSelection = useObjectTreeStore(state => state.toggleSelection);
  const isSelected = useObjectTreeStore(state => state.isSelected);
  
  const hasSelection = selectedIds.length > 0;
  const selectionCount = selectedIds.length;
  const isSingleSelection = selectedIds.length === 1;
  const isMultiSelection = selectedIds.length > 1;
  
  /**
   * Get the first selected object (useful for single selection)
   */
  const firstSelected = selectedObjects[0] || null;
  
  /**
   * Select multiple objects
   */
  const selectMultiple = (ids: string[]) => {
    ids.forEach(id => selectObject(id, true));
  };
  
  /**
   * Deselect a specific object
   */
  const deselectObject = (id: string) => {
    if (isSelected(id)) {
      toggleSelection(id);
    }
  };
  
  /**
   * Select all objects
   */
  const selectAll = () => {
    const allIds = Object.keys(useObjectTreeStore.getState().objects);
    allIds.forEach(id => selectObject(id, true));
  };
  
  /**
   * Select objects by type
   */
  const selectByType = (type: string) => {
    clearSelection();
    const objects = Object.values(useObjectTreeStore.getState().objects);
    objects
      .filter(obj => obj.type === type)
      .forEach(obj => selectObject(obj.id, true));
  };
  
  return {
    // State
    selectedIds,
    selectedObjects,
    hasSelection,
    selectionCount,
    isSingleSelection,
    isMultiSelection,
    firstSelected,
    
    // Actions
    selectObject,
    clearSelection,
    toggleSelection,
    isSelected,
    selectMultiple,
    deselectObject,
    selectAll,
    selectByType,
  };
}

/**
 * Use selection actions hook
 * 
 * Provides only the selection action functions (no state).
 * Useful for components that need to trigger selections without re-rendering on selection changes.
 * 
 * @returns Selection actions
 */
export function useSelectionActions() {
  return {
    selectObject: useObjectTreeStore(state => state.selectObject),
    clearSelection: useObjectTreeStore(state => state.clearSelection),
    toggleSelection: useObjectTreeStore(state => state.toggleSelection),
  };
}

/**
 * Use selection state hook
 * 
 * Provides only the selection state (no actions).
 * Useful for display components that don't need to modify selection.
 * 
 * @returns Selection state
 */
export function useSelectionState() {
  const selectedIds = useObjectTreeStore(state => state.selectedIds);
  const selectedObjects = useObjectTreeStore(state => state.getSelectedObjects());
  
  return {
    selectedIds,
    selectedObjects,
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length,
    isSingleSelection: selectedIds.length === 1,
    isMultiSelection: selectedIds.length > 1,
    firstSelected: selectedObjects[0] || null,
  };
}
