# Upload Workflows - Visual Guide

## Two Entry Points, Same System

---

## Workflow A: Studio Page Upload (New!)

**When:** User doesn't have a project yet  
**Goal:** Quick start - upload audio and get to work

```
┌─────────────────────────────────────────────────────────────┐
│ Studio Home (/studio)                                       │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │  📤 Upload Audio File                             │     │
│  │  Drop files here or click to browse               │ ◄── Click or drag
│  │  • Creates project automatically                  │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│  Recent Projects:                                          │
│    [Project 1]  [Project 2]  [+ New]                      │
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ File Picker Opens     │
        │ Select: song.mp3      │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ Creating project      │
        │ "song"...            │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ Uploading song.mp3    │
        │ (1/1)...             │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ Navigate to project   │
        │ /project/{new-id}     │
        └───────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Project Workspace                                           │
│                                                             │
│  Objects          │ Track Area                             │
│  ─────────        │                                         │
│  🎵 song.mp3 ◄────┼─ Audio loaded and ready!               │
│                   │                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow B: Project Workspace Upload

**When:** User already in a project  
**Goal:** Add more audio to existing project

```
┌─────────────────────────────────────────────────────────────┐
│ Project Workspace (/project/abc-123)                        │
│                                                             │
│  Header:  [Logo]  My Project  [📤 Upload] ◄── Click here  │
│                                                             │
│  ┌──────────────┬─────────────────────────────────────────┐│
│  │ Objects      │ Track Area                              ││
│  │ ─────────    │                                         ││
│  │ [+ Add] ◄────┼─ Or click here                          ││
│  │              │                                         ││
│  │ 🎵 existing  │                                         ││
│  │    .mp3      │         Or drag files here ────────►    ││
│  │              │                                         ││
│  └──────────────┴─────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ File Picker Opens     │
        │ Select: new.wav       │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │ Uploading new.wav     │
        │ (1/1)...             │
        └───────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Project Workspace (updated)                                 │
│                                                             │
│  Objects          │ Track Area                             │
│  ─────────        │                                         │
│  🎵 existing.mp3  │                                         │
│  🎵 new.wav ◄─────┼─ New root object added!                │
│                   │                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Object Tree Evolution

### Step 1: Fresh Upload
```
🎵 song.mp3 (root, parentId = null)
```

### Step 2: Add More Audio
```
🎵 song.mp3 (root)
🎵 drums.wav (root) ← Added via "Upload" button
```

### Step 3: Separate Stems (Future)
```
🎵 song.mp3 (root)
   ├─ 🎤 vocals.mp3 (child of song.mp3)
   ├─ 🥁 drums.mp3 (child of song.mp3)
   ├─ 🎸 bass.mp3 (child of song.mp3)
   └─ 🎹 other.mp3 (child of song.mp3)
🎵 drums.wav (root)
```

### Step 4: Convert to MIDI (Future)
```
🎵 song.mp3 (root)
   ├─ 🎤 vocals.mp3
   ├─ 🥁 drums.mp3
   ├─ 🎸 bass.mp3
   └─ 🎹 other.mp3
🎵 drums.wav (root)
   └─ 🎹 drums.mid (child of drums.wav) ← MIDI conversion
```

**Rule:** Uploads = Roots. Tool outputs = Children.

---

## Multi-File Upload

### From Studio Page
```
User selects:
  - vocals.mp3
  - drums.wav
  - bass.mp3

Result:
  1. Project created: "vocals"
  2. All 3 files uploaded
  3. Navigate to project
  
Object tree:
  🎵 vocals.mp3 (root)
  🎵 drums.wav (root)
  🎵 bass.mp3 (root)
```

### From Project Workspace
```
Existing tree:
  🎵 existing.mp3

User uploads:
  - new1.wav
  - new2.mp3

Result:
  🎵 existing.mp3 (root)
  🎵 new1.wav (root) ← Added
  🎵 new2.mp3 (root) ← Added
```

---

## Comparison: Studio vs Project Upload

| Feature | Studio Page | Project Workspace |
|---------|-------------|-------------------|
| **Creates project?** | ✅ Yes (auto) | ❌ No (uses current) |
| **Project name** | From first filename | N/A |
| **Navigation** | → New project | Stays in current |
| **Use case** | Quick start | Add to existing |
| **Entry points** | 1. Click button<br>2. Drag & drop | 1. "Upload" header button<br>2. "Add Object" panel button<br>3. Drag onto panel<br>4. Empty state CTA |

---

## Technical Flow

### Studio Page Upload
```typescript
handleUploadAudio() {
  // 1. Open file picker
  files = await openFilePicker({ multiple: true });
  
  // 2. Create project
  project = await createProject({ 
    name: files[0].name.replace(/\.[^/.]+$/, '') 
  });
  
  // 3. Upload files
  for (file of files) {
    await uploadProjectAudio(project.id, file);
  }
  
  // 4. Navigate
  router.push(`/project/${project.id}`);
}
```

### Project Workspace Upload
```typescript
handleAddObject() {
  // 1. Open file picker
  files = await openFilePicker({ multiple: true });
  
  // 2. Upload to current project
  for (file of files) {
    await uploadFile(file, null); // parentId = null → root
  }
  
  // uploadFile internally:
  //   - Uploads to API
  //   - Converts response to AudioObject
  //   - Calls addObject(audioObj, null)
  //   - Object appears in tree immediately
}
```

---

## Error Handling

### Studio Page
```
Upload fails during project creation:
  ✗ Error shown
  ✗ No navigation
  ✗ User stays on studio page
  ➜ Can retry

Upload fails after project created:
  ✗ Error shown
  ✗ No navigation
  ✗ Partial project left in database
  ➜ User can navigate manually or retry
```

### Project Workspace
```
Upload fails:
  ✗ Toast shows error
  ✗ Error in panel footer
  ✗ Upload button re-enabled
  ✗ No partial state (nothing added to tree)
  ➜ User can retry
```

---

## User Journey Examples

### Journey 1: Complete Beginner
```
1. Opens app → /studio
2. Sees "Upload Audio File" button
3. Clicks → Selects "my-song.mp3"
4. Automatically in project workspace
5. Sees audio in object tree
6. Can click play (Phase 18)
7. Can right-click → tools (Phase 15-17)

Time: 10 seconds from open to working!
```

### Journey 2: Experienced User
```
1. Already in project
2. Drags 5 audio files from desktop
3. Drops on object panel
4. All 5 appear as roots immediately
5. Continues working

Time: 2 seconds per file
```

### Journey 3: Stem Workflow
```
1. Upload "full-mix.wav" from studio page
2. In project workspace, right-click → "Separate Stems"
3. Wait for processing
4. Stems appear as children:
   - full-mix.wav (root)
     ├─ vocals.mp3
     ├─ drums.mp3
     ├─ bass.mp3
     └─ other.mp3
5. Mute drums, solo vocals
6. Export stems separately

Clean hierarchy!
```

---

## Keyboard Shortcuts (Future)

| Key | Action |
|-----|--------|
| `Cmd/Ctrl + U` | Open upload dialog |
| `Cmd/Ctrl + N` | New project (studio page) |
| `Cmd/Ctrl + O` | Open project |
| `Cmd/Ctrl + I` | Import audio |

---

## Mobile Considerations (Future)

Studio page upload works on mobile:
- File picker native to device
- Can select from camera roll
- Can select from Files app
- No drag & drop (not supported on touch)

Project workspace:
- Header "Upload" button works
- "Add Object" button works
- No drag & drop
- Consider: Import from cloud storage

---

## Summary

Two complementary workflows:

1. **Studio Page**: Fast onboarding, auto-create project
2. **Project Workspace**: Power user, multiple entry points

Both use same upload system, both create root objects, both work with tools (future).

**Design philosophy**: Make it easy to start, powerful once you're in.
