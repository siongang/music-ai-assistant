/**
 * Object Tree Store Tests
 * 
 * Tests for the object tree state management system.
 */

import { useObjectTreeStore } from '@/features/object-tree/store/object-tree-store';
import { ObjectType } from '@/types';
import type { MusicalObject, AudioObject } from '@/types';

console.log('🧪 Testing Phase 4: Object Tree State Management\n');

// Helper to create a test audio object
function createAudioObject(id: string, name: string): AudioObject {
  return {
    id,
    name,
    type: ObjectType.Audio,
    parentId: null,
    children: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Get initial state (before any tests)
const initialStore = useObjectTreeStore.getState();

// ===== Test 1: Initial State =====
console.log('✅ Test 1: Initial state');
console.log(`   - Objects: ${Object.keys(initialStore.objects).length}`);
console.log(`   - Root ID: ${initialStore.rootId}`);
console.log(`   - Selected IDs: ${initialStore.selectedIds.length}`);

if (Object.keys(initialStore.objects).length !== 0) {
  throw new Error('Expected empty objects map');
}
if (initialStore.rootId !== null) {
  throw new Error('Expected null root ID');
}
if (initialStore.selectedIds.length !== 0) {
  throw new Error('Expected empty selection');
}

// ===== Test 2: Add Object =====
console.log('\n✅ Test 2: Add object to tree');

const audio1 = createAudioObject('audio-1', 'song.wav');
initialStore.addObject(audio1);

const state1 = useObjectTreeStore.getState();
console.log(`   - Objects after add: ${Object.keys(state1.objects).length}`);
console.log(`   - Root ID: ${state1.rootId}`);
console.log(`   - Object exists: ${state1.objects['audio-1'] ? 'Yes' : 'No'}`);

if (Object.keys(state1.objects).length !== 1) {
  throw new Error('Expected 1 object');
}
if (state1.rootId !== 'audio-1') {
  throw new Error('Expected audio-1 as root');
}

// ===== Test 3: Add Child Object =====
console.log('\n✅ Test 3: Add child object');

const child1 = createAudioObject('child-1', 'vocals.wav');
state1.addObject(child1, 'audio-1');

const state2 = useObjectTreeStore.getState();
console.log(`   - Total objects: ${Object.keys(state2.objects).length}`);
console.log(`   - Parent has children: ${state2.objects['audio-1'].children.length}`);
console.log(`   - Child's parent ID: ${state2.objects['child-1'].parentId}`);

if (Object.keys(state2.objects).length !== 2) {
  throw new Error('Expected 2 objects');
}
if (state2.objects['audio-1'].children.length !== 1) {
  throw new Error('Expected 1 child');
}
if (state2.objects['child-1'].parentId !== 'audio-1') {
  throw new Error('Expected child-1 parent to be audio-1');
}

// ===== Test 4: Get Children =====
console.log('\n✅ Test 4: Get children of object');

const children = state2.getChildren('audio-1');
console.log(`   - Children count: ${children.length}`);
console.log(`   - Children names: ${children.map(c => c.name).join(', ')}`);

if (children.length !== 1) {
  throw new Error('Expected 1 child');
}
if (children[0].id !== 'child-1') {
  throw new Error('Expected child-1');
}

// ===== Test 5: Get Root Objects =====
console.log('\n✅ Test 5: Get root objects');

const roots = state2.getRootObjects();
console.log(`   - Root objects count: ${roots.length}`);
console.log(`   - Root names: ${roots.map(r => r.name).join(', ')}`);

if (roots.length !== 1) {
  throw new Error('Expected 1 root object');
}
if (roots[0].id !== 'audio-1') {
  throw new Error('Expected audio-1 as root');
}

// ===== Test 6: Update Object =====
console.log('\n✅ Test 6: Update object');

state2.updateObject('audio-1', { name: 'updated_song.wav' });

const state3 = useObjectTreeStore.getState();
console.log(`   - Updated name: ${state3.objects['audio-1'].name}`);

if (state3.objects['audio-1'].name !== 'updated_song.wav') {
  throw new Error('Expected updated name');
}

// ===== Test 7: Select Object =====
console.log('\n✅ Test 7: Select object');

state3.selectObject('audio-1');

const state4 = useObjectTreeStore.getState();
console.log(`   - Selected IDs: ${state4.selectedIds.join(', ')}`);
console.log(`   - Is audio-1 selected: ${state4.isSelected('audio-1')}`);

if (state4.selectedIds.length !== 1) {
  throw new Error('Expected 1 selected object');
}
if (!state4.isSelected('audio-1')) {
  throw new Error('Expected audio-1 to be selected');
}

// ===== Test 8: Multi-Select =====
console.log('\n✅ Test 8: Multi-select objects');

state4.selectObject('child-1', true); // multi=true

const state5 = useObjectTreeStore.getState();
console.log(`   - Selected IDs: ${state5.selectedIds.join(', ')}`);
console.log(`   - Selection count: ${state5.selectedIds.length}`);

if (state5.selectedIds.length !== 2) {
  throw new Error('Expected 2 selected objects');
}
if (!state5.isSelected('audio-1') || !state5.isSelected('child-1')) {
  throw new Error('Expected both objects to be selected');
}

// ===== Test 9: Get Selected Objects =====
console.log('\n✅ Test 9: Get selected objects');

const selectedObjects = state5.getSelectedObjects();
console.log(`   - Selected objects: ${selectedObjects.map(o => o.name).join(', ')}`);

if (selectedObjects.length !== 2) {
  throw new Error('Expected 2 selected objects');
}

// ===== Test 10: Toggle Selection =====
console.log('\n✅ Test 10: Toggle selection');

state5.toggleSelection('audio-1'); // Deselect

const state6 = useObjectTreeStore.getState();
console.log(`   - Selected IDs after toggle: ${state6.selectedIds.join(', ')}`);
console.log(`   - Is audio-1 selected: ${state6.isSelected('audio-1')}`);

if (state6.selectedIds.length !== 1) {
  throw new Error('Expected 1 selected object');
}
if (state6.isSelected('audio-1')) {
  throw new Error('Expected audio-1 to be deselected');
}

// ===== Test 11: Clear Selection =====
console.log('\n✅ Test 11: Clear selection');

state6.clearSelection();

const state7 = useObjectTreeStore.getState();
console.log(`   - Selected IDs after clear: ${state7.selectedIds.length}`);

if (state7.selectedIds.length !== 0) {
  throw new Error('Expected empty selection');
}

// ===== Test 12: Get Object Path =====
console.log('\n✅ Test 12: Get object path (hierarchy)');

// Add a grandchild
const grandchild = createAudioObject('grandchild-1', 'harmony.wav');
state7.addObject(grandchild, 'child-1');

const state8 = useObjectTreeStore.getState();
const path = state8.getPath('grandchild-1');
console.log(`   - Path length: ${path.length}`);
console.log(`   - Path: ${path.map(o => o.name).join(' → ')}`);

if (path.length !== 3) {
  throw new Error('Expected 3 objects in path');
}
if (path[0].id !== 'audio-1' || path[1].id !== 'child-1' || path[2].id !== 'grandchild-1') {
  throw new Error('Expected correct path order');
}

// ===== Test 13: Remove Object (with children) =====
console.log('\n✅ Test 13: Remove object and its children');

console.log(`   - Objects before remove: ${Object.keys(state8.objects).length}`);
state8.removeObject('child-1'); // Should also remove grandchild

const state9 = useObjectTreeStore.getState();
console.log(`   - Objects after remove: ${Object.keys(state9.objects).length}`);
console.log(`   - child-1 exists: ${state9.objects['child-1'] ? 'Yes' : 'No'}`);
console.log(`   - grandchild-1 exists: ${state9.objects['grandchild-1'] ? 'Yes' : 'No'}`);
console.log(`   - audio-1 children: ${state9.objects['audio-1'].children.length}`);

if (Object.keys(state9.objects).length !== 1) {
  throw new Error('Expected 1 object (only audio-1)');
}
if (state9.objects['child-1'] || state9.objects['grandchild-1']) {
  throw new Error('Expected children to be removed');
}
if (state9.objects['audio-1'].children.length !== 0) {
  throw new Error('Expected audio-1 to have no children');
}

// ===== Test 14: Get Object =====
console.log('\n✅ Test 14: Get object by ID');

const retrievedObject = state9.getObject('audio-1');
console.log(`   - Retrieved: ${retrievedObject ? retrievedObject.name : 'null'}`);

const nonExistent = state9.getObject('non-existent');
console.log(`   - Non-existent: ${nonExistent ? 'Found' : 'null'}`);

if (!retrievedObject) {
  throw new Error('Expected to retrieve audio-1');
}
if (nonExistent !== null) {
  throw new Error('Expected null for non-existent object');
}

// ===== Test 15: Clear All =====
console.log('\n✅ Test 15: Clear all objects');

console.log(`   - Objects before clearAll: ${Object.keys(state9.objects).length}`);
state9.clearAll();

const state10 = useObjectTreeStore.getState();
console.log(`   - Objects after clearAll: ${Object.keys(state10.objects).length}`);
console.log(`   - Root ID: ${state10.rootId}`);
console.log(`   - Selected IDs: ${state10.selectedIds.length}`);

if (Object.keys(state10.objects).length !== 0) {
  throw new Error('Expected empty objects map');
}
if (state10.rootId !== null) {
  throw new Error('Expected null root ID');
}

// ===== Test 16: Hierarchical Structure =====
console.log('\n✅ Test 16: Complex hierarchical structure');

// Create a tree structure:
//   root
//   ├── child1
//   │   ├── grandchild1
//   │   └── grandchild2
//   └── child2

const rootObj = createAudioObject('root', 'root.wav');
const child1Obj = createAudioObject('child1', 'child1.wav');
const child2Obj = createAudioObject('child2', 'child2.wav');
const gc1Obj = createAudioObject('gc1', 'grandchild1.wav');
const gc2Obj = createAudioObject('gc2', 'grandchild2.wav');

state10.addObject(rootObj);
state10.addObject(child1Obj, 'root');
state10.addObject(child2Obj, 'root');
state10.addObject(gc1Obj, 'child1');
state10.addObject(gc2Obj, 'child1');

const state11 = useObjectTreeStore.getState();
console.log(`   - Total objects: ${Object.keys(state11.objects).length}`);
console.log(`   - Root children: ${state11.getChildren('root').length}`);
console.log(`   - child1 children: ${state11.getChildren('child1').length}`);
console.log(`   - Grandchild1 path: ${state11.getPath('gc1').map(o => o.name).join(' → ')}`);

if (Object.keys(state11.objects).length !== 5) {
  throw new Error('Expected 5 objects');
}
if (state11.getChildren('root').length !== 2) {
  throw new Error('Expected 2 children of root');
}
if (state11.getChildren('child1').length !== 2) {
  throw new Error('Expected 2 children of child1');
}

// ===== Summary =====
console.log('\n🎉 All object tree tests passed!');
console.log('\n📋 Phase 4 Summary:');
console.log('   ✅ Zustand store with Immer middleware');
console.log('   ✅ Flat map structure for O(1) lookups');
console.log('   ✅ Add, remove, update operations');
console.log('   ✅ Parent-child relationships maintained');
console.log('   ✅ Recursive child removal');
console.log('   ✅ Single and multi-selection');
console.log('   ✅ Selection toggle and clear');
console.log('   ✅ Get children, roots, selected objects');
console.log('   ✅ Hierarchical path traversal');
console.log('   ✅ Object queries (getObject, getChildren, etc.)');
console.log('   ✅ Complex tree structures supported');
console.log('\n✨ Ready for Phase 5: Layout Shell\n');
