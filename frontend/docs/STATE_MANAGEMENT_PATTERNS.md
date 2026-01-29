# State Management Design Patterns

**Version**: 1.0  
**Last Updated**: 2026-01-29

## Overview

This document defines best practices for state management in the Music Assistant frontend. We use Zustand for global state and React hooks for local state. Following these patterns prevents data inconsistencies, performance issues, and bugs.

---

## Core Principles

### 1. **Normalized State**
- Store entities in flat maps by ID for O(1) lookup
- Store relationships as ID references, not embedded objects
- Derive computed values on-demand, don't store them

### 2. **Single Source of Truth**
- Each piece of data has ONE canonical location
- Don't duplicate data across multiple stores
- Derive views from the canonical source

### 3. **Immutable Updates**
- Use Immer middleware for safe state mutations
- Never mutate state directly outside of Zustand setters
- Return new objects/arrays for React to detect changes

---

## Pattern: Normalized Hierarchical Data

### The Problem: Dual Representation

When managing hierarchical data (like a tree), there's a temptation to store both:
1. A flat map for lookups: `objects: Record<string, MusicalObject>`
2. Embedded children arrays: `object.children: MusicalObject[]`

**This creates sync issues**: If you add an object with a `parentId` but forget to update the parent's `children` array, the data becomes inconsistent.

### ❌ INCORRECT: Mixed Representation

```typescript
// BAD: Storing both map AND embedded children
interface State {
  objects: Record<string, MusicalObject>; // Flat map
}

interface MusicalObject {
  id: string;
  parentId: string | null;
  children: MusicalObject[]; // PROBLEM: Embedded children can get out of sync
}

// Adding object updates map but might forget to update parent.children
addObject: (object, parentId) => {
  set((state) => {
    object.parentId = parentId;
    state.objects[object.id] = object;
    
    // BUG: What if we forget this? Now parent.children is stale!
    if (parentId && state.objects[parentId]) {
      state.objects[parentId].children.push(object);
    }
  });
}
```

**Problems**:
- `removeRecursive` might iterate over `obj.children` while `getChildren` filters by `parentId`
- Updating `parentId` doesn't update old parent's `children` array
- Objects added with pre-populated `children` bypass parentId relationship
- Leads to orphaned nodes and stale references

### ✅ CORRECT: Normalized with ID References

```typescript
// GOOD: Single source of truth - derive children from parentId
interface State {
  objects: Record<string, MusicalObject>; // Flat map is the source of truth
}

interface MusicalObject {
  id: string;
  parentId: string | null;
  children: MusicalObject[]; // Empty in storage, populated on-demand by getters
}

// Adding: Only set parentId and store in map
addObject: (object, parentId = null) => {
  set((state) => {
    object.parentId = parentId;
    object.children = []; // Always empty - we derive this
    state.objects[object.id] = object;
    
    if (!state.rootId && !parentId) {
      state.rootId = object.id;
    }
    
    // No need to update parent.children - it's derived on-demand
  });
}

// Derive children from parentId when needed
getChildren: (parentId) => {
  const state = get();
  return Object.values(state.objects).filter(
    obj => obj.parentId === parentId
  );
}

// Removing: Derive children, don't rely on stored array
removeObject: (id) => {
  set((state) => {
    const removeRecursive = (objId: string) => {
      const obj = state.objects[objId];
      if (!obj) return;
      
      // Derive children from parentId, not stored array
      const children = Object.values(state.objects).filter(
        o => o.parentId === objId
      );
      
      for (const child of children) {
        removeRecursive(child.id);
      }
      
      delete state.objects[objId];
    };
    
    removeRecursive(id);
  });
}
```

**Why This Works**:
- `parentId` is the single source of truth for relationships
- Children are computed on-demand, never stale
- Moving objects (changing `parentId`) automatically updates relationships
- No sync issues between map and children arrays

---

## Pattern: State Update Safety

### Avoid Unintended Updates

When updating objects, be careful not to break relationships or propagate mutations:

### ❌ INCORRECT: Unsafe Updates

```typescript
// BAD: Blindly applies all updates, can break relationships
updateObject: (id, updates) => {
  set((state) => {
    const object = state.objects[id];
    if (!object) return;
    
    // PROBLEM: What if updates.children contains embedded objects?
    Object.assign(object, updates);
    object.updatedAt = new Date();
  });
}
```

### ✅ CORRECT: Safe Property Updates

```typescript
// GOOD: Filter out children array, handle parentId changes
updateObject: (id, updates) => {
  set((state) => {
    const object = state.objects[id];
    if (!object) return;
    
    // Exclude children from updates - we don't store that
    const { children, ...safeUpdates } = updates as Partial<MusicalObject> & { 
      children?: MusicalObject[] 
    };
    
    Object.assign(object, safeUpdates);
    object.updatedAt = new Date();
    
    // Note: If parentId changed, relationship updates automatically
    // because getChildren() derives from parentId at query time
  });
}
```

---

## Pattern: Selector Design

### Derive, Don't Store

Compute derived state in selectors, don't store it:

### ✅ CORRECT: Derived Selectors

```typescript
// GOOD: Compute on-demand
const useObjectTreeStore = create<ObjectTreeStore>()(
  immer((set, get) => ({
    // ... state ...
    
    // Derive children from parentId
    getChildren: (parentId) => {
      return Object.values(get().objects).filter(
        obj => obj.parentId === parentId
      );
    },
    
    // Derive root objects
    getRootObjects: () => {
      return Object.values(get().objects).filter(
        obj => obj.parentId === null
      );
    },
    
    // Derive path by walking up parentId chain
    getPath: (id) => {
      const state = get();
      const path: MusicalObject[] = [];
      let currentId: string | null = id;
      
      while (currentId) {
        const obj = state.objects[currentId];
        if (!obj) break;
        
        path.unshift(obj);
        currentId = obj.parentId;
      }
      
      return path;
    },
  }))
);
```

### ❌ INCORRECT: Storing Derived Data

```typescript
// BAD: Storing computed data that can become stale
interface State {
  objects: Record<string, MusicalObject>;
  rootObjects: MusicalObject[]; // PROBLEM: Can get out of sync
  pathCache: Record<string, MusicalObject[]>; // PROBLEM: Needs manual invalidation
}
```

**Why**: Derived data can become stale. Computing on-demand keeps it always correct.

---

## Pattern: Immer Usage with Zustand

### Immer Middleware Benefits

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useStore = create<State>()(
  immer((set, get) => ({
    // Immer allows "mutating" draft state
    addItem: (item) => {
      set((state) => {
        // This looks like mutation but Immer makes it immutable
        state.items[item.id] = item;
        state.count += 1;
      });
    },
  }))
);
```

**Benefits**:
- Write simpler update logic (looks like mutations)
- Immer ensures immutability under the hood
- React detects changes correctly

### Rules with Immer

1. **Don't mix mutation styles**: Either mutate draft OR return new state, not both
2. **Don't return values from set callback**: Immer callbacks should not return values
3. **Don't store class instances**: Immer works with plain objects/arrays

---

## Pattern: Performance Optimization

### Selector Granularity

Use fine-grained selectors to minimize re-renders:

### ❌ INCORRECT: Over-Selecting

```typescript
// BAD: Component re-renders on ANY store change
function MyComponent() {
  const store = useObjectTreeStore(); // Subscribes to entire store
  const object = store.objects[id];
  // ...
}
```

### ✅ CORRECT: Targeted Selectors

```typescript
// GOOD: Only re-renders when this specific object changes
function MyComponent({ id }: { id: string }) {
  const object = useObjectTreeStore(state => state.objects[id]);
  const isSelected = useObjectTreeStore(state => state.isSelected(id));
  // Only re-renders if object or selection changes
}
```

### Memoize Derived Arrays

```typescript
// GOOD: Memoize array filters to prevent unnecessary re-renders
const useChildren = (parentId: string) => {
  return useObjectTreeStore(
    useCallback(
      (state) => Object.values(state.objects).filter(
        obj => obj.parentId === parentId
      ),
      [parentId]
    )
  );
};
```

---

## Pattern: State Initialization

### Lazy Initialization

For expensive initial state:

```typescript
const useStore = create<State>()(
  immer((set, get) => ({
    objects: {}, // Start empty
    
    // Load data on-demand
    loadFromAPI: async () => {
      const data = await fetchObjects();
      set((state) => {
        data.forEach(obj => {
          state.objects[obj.id] = obj;
        });
      });
    },
  }))
);
```

---

## Common Mistakes to Avoid

1. **Storing Embedded Objects**: Use ID references, not full objects
2. **Duplicating Data**: One canonical source per entity
3. **Forgetting to Derive**: Compute relationships on-demand
4. **Mutating Outside Zustand**: Always use `set()` to update state
5. **Over-Selecting**: Use granular selectors to minimize re-renders
6. **Storing Derived State**: Compute it when needed
7. **Inconsistent Children/ParentId**: Always derive children from parentId

---

## Testing State Management

### Test Store Actions

```typescript
import { renderHook, act } from '@testing-library/react';
import { useObjectTreeStore } from './object-tree-store';

describe('ObjectTreeStore', () => {
  beforeEach(() => {
    useObjectTreeStore.getState().clearAll();
  });
  
  it('should add object and derive children correctly', () => {
    const { result } = renderHook(() => useObjectTreeStore());
    
    const parent: MusicalObject = { id: '1', parentId: null, /* ... */ };
    const child: MusicalObject = { id: '2', parentId: '1', /* ... */ };
    
    act(() => {
      result.current.addObject(parent);
      result.current.addObject(child, '1');
    });
    
    // Verify child is derived from parentId
    const children = result.current.getChildren('1');
    expect(children).toHaveLength(1);
    expect(children[0].id).toBe('2');
  });
  
  it('should handle parent changes correctly', () => {
    // Add objects
    const parent1: MusicalObject = { id: '1', parentId: null, /* ... */ };
    const parent2: MusicalObject = { id: '2', parentId: null, /* ... */ };
    const child: MusicalObject = { id: '3', parentId: '1', /* ... */ };
    
    const { result } = renderHook(() => useObjectTreeStore());
    
    act(() => {
      result.current.addObject(parent1);
      result.current.addObject(parent2);
      result.current.addObject(child, '1');
    });
    
    // Move child to parent2
    act(() => {
      result.current.updateObject('3', { parentId: '2' });
    });
    
    // Verify relationship updated automatically
    expect(result.current.getChildren('1')).toHaveLength(0);
    expect(result.current.getChildren('2')).toHaveLength(1);
  });
});
```

---

## Checklist for New Stores

When creating a new Zustand store:

- [ ] Use Immer middleware for safe mutations
- [ ] Store entities in flat maps by ID
- [ ] Use ID references for relationships, not embedded objects
- [ ] Derive computed values in selectors/getters
- [ ] Don't duplicate data - one source of truth
- [ ] Write granular selectors for performance
- [ ] Add comprehensive tests for actions
- [ ] Document state shape and actions

---

## Related Documentation

- [API Client Patterns](./API_CLIENT_PATTERNS.md) - How to fetch data for stores
- [Architecture Overview](./ARCHITECTURE.md) - Overall system architecture
- [Object Tree Feature](../src/features/object-tree/README.md) - Object tree implementation

---

## Migration Guide: Fixing Dual Representation

If you have existing code with dual representation (map + embedded children):

### Step 1: Update Add Method
```typescript
// Remove code that updates parent.children array
// Only set parentId and store in map
```

### Step 2: Update Remove Method
```typescript
// Change from: for (const child of obj.children)
// Change to: const children = Object.values(state.objects).filter(o => o.parentId === objId)
```

### Step 3: Update Update Method
```typescript
// Filter out children from updates
const { children, ...safeUpdates } = updates;
Object.assign(object, safeUpdates);
```

### Step 4: Ensure children Array Is Empty
```typescript
// In addObject:
object.children = []; // Always empty in storage
```

### Step 5: Test Thoroughly
- Add objects with various parent relationships
- Remove objects and verify children are removed
- Update parentId and verify relationships update
- Check that getChildren always returns correct results

---

## Questions?

If you're unsure about a state management pattern:

1. Check existing stores for examples
2. Review this document
3. Write tests to verify behavior
4. Consult team lead if still unclear

**Remember**: Normalized state prevents bugs. Always prefer ID references over embedded objects.
