# Upload Workflow Changes - Summary

**Date:** February 1, 2026  
**Changes:** Root-level uploads + Studio page upload

---

## What Changed

### 1. Each Upload is Now a Root Object ✅

**Before:**
- Uploads were children of `rootId`
- Single root object concept
- Tree had one top-level container

**After:**
- Each uploaded audio file is its own root (`parentId = null`)
- Multiple root objects supported
- Only tool outputs (stems, MIDI) are children of audio files

**Why:**
- Simpler mental model: audio files are top-level
- Tool outputs naturally group under their source
- More flexible for organizing projects

---

### 2. Studio Page Upload → Auto-Create Project ✅

**Before:**
- Upload button said "Create a project first"
- Not functional
- Extra step for users

**After:**
- Click or drag → Upload audio
- Automatically creates project (named after first file)
- Uploads all selected files
- Navigates to project workspace
- Audio appears in object tree immediately

**Why:**
- Faster workflow (one step instead of two)
- Better UX for beginners
- Common DAW pattern (Logic Pro, Ableton do this)

---

## Code Changes

### Frontend Changes

#### 1. `app/(studio)/project/[id]/layout.tsx`

**Changed parent ID for uploads:**
```diff
- await uploadFile(file, rootId);
+ await uploadFile(file, null); // Each upload is a root object
```

**Use all root objects instead of single root:**
```diff
- const rootIds = rootId ? [rootId] : [];
- const rootObjects = rootIds.map((id) => objects[id]).filter(Boolean);
+ const rootObjects = getRootObjects(); // All objects with parentId === null
```

**Simplified tree hydration:**
```diff
- // Add root first, then rest
- if (root) addObject(root, null);
- for (const id of Object.keys(objs)) {
-   if (id === tree.root_id) continue;
-   addObject(obj, obj.parent_id);
- }
+ // Add all objects with their parent_id
+ for (const id of Object.keys(objs)) {
+   addObject(obj, obj.parent_id); // null for roots
+ }
```

**Save tree without root_id:**
```diff
  const snapshot = {
    objects: {...},
-   root_id: state.rootId,
+   root_id: null, // No single root
  };
```

#### 2. `app/(studio)/studio/page.tsx`

**Added upload workflow:**
```typescript
// Click "Upload Audio File" button
const handleUploadAudio = async () => {
  const files = await openFilePicker({ multiple: true });
  
  // Create project with first file's name
  const created = await createProject({ 
    name: files[0].name.replace(/\.[^/.]+$/, '') 
  });
  
  // Upload all files to project
  for (const file of files) {
    await uploadProjectAudio(created.id, file);
  }
  
  // Navigate to project
  router.push(`/project/${created.id}`);
};

// Drag & drop on studio page
const handleFilesDropped = async (files: File[]) => {
  // Same flow as above
};
```

**Wrapped upload button with DropZone:**
```tsx
<DropZone onFilesDropped={handleFilesDropped}>
  <button onClick={handleUploadAudio}>
    Upload Audio File
  </button>
</DropZone>
```

---

### Backend Changes

**None required!** ✅

The backend:
- Already supports project-scoped audio (`POST /projects/{id}/audio`)
- Doesn't care about tree structure (frontend manages that)
- Returns `{ audio_id, filename, project_id }`
- Frontend adapts response to tree structure

---

## New Workflows

### Workflow 1: Upload from Studio Page

```
User on studio home page (/studio)
  ↓
Click "Upload Audio File" OR drag files
  ↓
File picker opens (or files dropped)
  ↓
Select file(s): song.mp3, drums.wav
  ↓
Frontend creates project: "song" (from first filename)
  ↓
Frontend uploads both files to project
  ↓
Navigate to /project/{id}
  ↓
Object tree shows:
  - song.mp3 (root)
  - drums.wav (root)
```

### Workflow 2: Upload from Project Workspace

```
User in project workspace (/project/{id})
  ↓
Click "Add Object" OR "Upload" button OR drag files
  ↓
Select file(s)
  ↓
Upload to current project
  ↓
Object tree shows new root objects:
  - existing-audio.mp3 (root)
  - new-audio.wav (root) ← new
```

### Workflow 3: Tool Outputs (Future)

```
User has uploaded audio
Object tree shows:
  - song.mp3 (root)
  
Right-click "song.mp3" → "Separate Stems"
  ↓
Backend creates job, processes stems
  ↓
Frontend receives job result
  ↓
Object tree shows:
  - song.mp3 (root)
    ├── vocals.mp3 (child)
    ├── drums.mp3 (child)
    ├── bass.mp3 (child)
    └── other.mp3 (child)
```

---

## Object Tree Structure

### Before (Single Root)

```
Root Container (id: root-id, parentId: null)
├── audio-1.mp3 (parentId: root-id)
├── audio-2.wav (parentId: root-id)
└── audio-3.mp3 (parentId: root-id)
    ├── vocals.mp3 (parentId: audio-3)
    └── drums.mp3 (parentId: audio-3)
```

### After (Multiple Roots)

```
audio-1.mp3 (parentId: null) ← root
audio-2.wav (parentId: null) ← root
audio-3.mp3 (parentId: null) ← root
├── vocals.mp3 (parentId: audio-3)
├── drums.mp3 (parentId: audio-3)
├── bass.mp3 (parentId: audio-3)
└── other.mp3 (parentId: audio-3)
```

**Cleaner! Each audio file is top-level. Only tool outputs nest.**

---

## Testing

### Test 1: Studio Page Upload

1. Go to `http://localhost:3000/studio`
2. Click "Upload Audio File" button
3. Select `test.mp3`
4. **Expected:**
   - Progress: "Creating project 'test'..."
   - Progress: "Uploading test.mp3 (1/1)..."
   - Navigate to `/project/{new-id}`
   - Object tree shows `test.mp3` as root

### Test 2: Studio Page Drag & Drop

1. Go to `/studio`
2. Drag `song.mp3` from desktop
3. Drop on upload button area
4. **Expected:** Same as Test 1

### Test 3: Multiple Files from Studio

1. Go to `/studio`
2. Click "Upload Audio File"
3. Select multiple files: `a.mp3`, `b.wav`, `c.mp3`
4. **Expected:**
   - Project created with name "a"
   - All 3 files uploaded
   - Object tree shows all 3 as roots

### Test 4: Project Workspace Upload

1. Open existing project
2. Click "Upload" button in header
3. Select `new-audio.wav`
4. **Expected:**
   - File uploads to current project
   - Appears as new root in tree (not child of existing)

### Test 5: Mixed Roots

1. Upload `audio.mp3` (becomes root)
2. Right-click → "Separate Stems" (future)
3. **Expected:**
   - `audio.mp3` (root)
     - `vocals.mp3` (child)
     - `drums.mp3` (child)
     - etc.
4. Upload another file `audio2.mp3`
5. **Expected:**
   - `audio.mp3` (root, with children)
   - `audio2.mp3` (root, no children yet)

---

## Migration Notes

### For Existing Projects

If you have existing projects with the old tree structure:

**No migration needed!** The new code handles both:
- Old structure with `root_id` set: Will load that root + children
- New structure with `root_id = null`: Will load all `parentId === null` objects

The next time a project is saved, it will use the new format (`root_id: null`).

### For Backend

**No changes required.** Backend doesn't care about tree structure.

---

## Visual Comparison

### Studio Page - Before
```
┌────────────────────────────────┐
│  Upload Audio File             │
│  Create a project first, then  │
│  upload in workspace           │  ← Not functional
└────────────────────────────────┘
```

### Studio Page - After
```
┌────────────────────────────────┐
│  Upload Audio File             │
│  Drop files or click to browse │
│  • Creates project automatically│  ← Functional!
└────────────────────────────────┘
     ↓ (drag files here)
```

### Object Tree - Before
```
📁 Root
  └─ 🎵 audio.mp3
  └─ 🎵 audio2.mp3
```

### Object Tree - After
```
🎵 audio.mp3
🎵 audio2.mp3
🎵 audio3.mp3
  └─ 🎤 vocals.mp3
  └─ 🥁 drums.mp3
```

---

## Benefits

### For Users

1. **Faster workflow**: Upload → auto-create project → done
2. **Cleaner tree**: Audio files at top level, easy to find
3. **Logical grouping**: Tool outputs group under source audio
4. **Multiple entry points**: Studio page or project workspace

### For Developers

1. **Simpler mental model**: No special root object
2. **Consistent structure**: `parentId === null` means root
3. **Flexible**: Easy to add more root-level object types later
4. **No backend changes**: All in frontend

### For Future Features

1. **MIDI files**: Can also be roots (not just audio)
2. **Sheet music**: Can be roots
3. **Folders**: Can be roots (organize multiple files)
4. **Playlist objects**: Can be roots

---

## Updated Documentation

Files to update:
- ✅ `UPLOAD_WORKFLOW_COMPLETE.md` - Add studio page flow
- ✅ `UPLOAD_ENTRY_POINTS.md` - Add studio page entry point
- ✅ `PHASE_20_COMPLETE.md` - Update with new root behavior
- ✅ This file: `UPLOAD_CHANGES_SUMMARY.md`

---

## Ready to Test! 🚀

Try both workflows:
1. **Studio page**: Drag audio → Auto-create project
2. **Project workspace**: Upload adds root objects

Both should work seamlessly with the same upload system, just different entry points and behaviors.
