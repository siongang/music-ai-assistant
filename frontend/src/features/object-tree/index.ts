/**
 * Object Tree Module
 * 
 * Re-exports all object tree functionality for easy importing.
 * 
 * Usage:
 *   import { useObjectTree, useObjectSelection } from '@/features/object-tree'
 */

// Store
export { useObjectTreeStore } from './store/object-tree-store';

// Main hooks
export {
  useObjectTree,
  useRootObjects,
  useSelectedObjects,
  useObject,
  useChildren,
  useIsSelected,
  useObjectPath,
  useObjectCount,
  useSelectionCount,
  useHasSelection,
} from './hooks/useObjectTree';

// Selection hooks
export {
  useObjectSelection,
  useSelectionActions,
  useSelectionState,
} from './hooks/useObjectSelection';
