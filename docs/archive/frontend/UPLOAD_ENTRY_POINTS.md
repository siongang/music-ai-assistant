# Audio Upload Entry Points - Visual Guide

## UI Layout with Upload Entry Points

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header                                                                      │
│  ┌──────┐  ┌──────┐                                                        │
│  │ Menu │  │ Logo │  Project Name                           ╔═════════╗    │
│  └──────┘  └──────┘                                          ║ UPLOAD  ║ ③  │
│                                                               ╚═════════╝    │
│                                                   Tempo  4/4  Am            │
└─────────────────────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────────────────────────────┐
│ Object Panel     │ Main Area (Track Editor)                                │
│                  │                                                          │
│  ╔═════════════╗ │                                                          │
│  ║ ADD OBJECT  ║ ① (Future: Drag & drop onto timeline) ⑤                  │
│  ╚═════════════╝ │                                                          │
│                  │                                                          │
│  ┌────────────┐  │                                                          │
│  │ 🎵 song.mp3│  │                                                          │
│  └────────────┘  │                                                          │
│  ┌────────────┐  │                                                          │
│  │ 🎹 track.mid│  │                                                          │
│  └────────────┘  │                                                          │
│                  │                                                          │
│  ╔═════════════╗ │                                                          │
│  ║ Drag & drop ║ ②                                                         │
│  ║ files here  ║ │                                                          │
│  ╚═════════════╝ │                                                          │
│                  │                                                          │
│  (When empty:)   │                                                          │
│  No objects yet  │                                                          │
│  ╔═════════════╗ │                                                          │
│  ║ Click to add║ ④                                                         │
│  ╚═════════════╝ │                                                          │
└──────────────────┴──────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│ Transport Bar                                                               │
│              ▶  ■  ⟳       00:00.0                                          │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────┐
                    │ Toast Notification (bottom-right) │
                    │  ⟳ Uploading...              │
                    │  song.mp3                    │
                    │  [████████░░] 80%            │
                    └──────────────────────────────┘
```

## Entry Point Details

### ① "Add Object" Button
**Location:** Top of object panel  
**Trigger:** Click  
**Action:** Opens native file picker dialog  
**Features:**
- Multi-file selection enabled
- Filters for audio files (.mp3, .wav)
- Shows spinner during upload
- Disabled while uploading

**Code:**
```tsx
<button onClick={handleAddObject} disabled={uploadState.isUploading}>
  {uploadState.isUploading ? 'Uploading...' : 'Add Object'}
</button>
```

---

### ② Drag & Drop Zone
**Location:** Entire object panel area  
**Trigger:** Drag files from desktop, drop on panel  
**Visual Feedback:**
- Blue gradient overlay appears during drag
- Icon and "Drop audio files to upload" message
- Overlay disappears on drop or drag leave

**Code:**
```tsx
<DropZone onFilesDropped={handleFilesDropped}>
  <ObjectPanel ... />
</DropZone>
```

**User Flow:**
1. Drag audio file(s) from desktop/finder
2. Hover over object panel → Blue overlay appears
3. Drop files → Upload starts
4. Toast notification shows progress

---

### ③ Header "Upload" Button
**Location:** Header toolbar, right side (next to tempo/key)  
**Trigger:** Click  
**Styling:** Cyan gradient background, always visible  
**Features:**
- Same as "Add Object" button
- More prominent, always accessible
- Good for users who don't see object panel

**Code:**
```tsx
<button onClick={handleAddObject} className="...gradient...">
  <UploadIcon />
  Upload
</button>
```

---

### ④ Empty State CTA
**Location:** Center of object panel when tree is empty  
**Trigger:** Click on "Drop files here or click to add" text  
**Context:** Only shows when no objects exist  
**Purpose:** Onboarding, guides new users

**Code:**
```tsx
{objectCount === 0 && (
  <button onClick={onAddObjectClick}>
    {isUploading ? 'Uploading...' : 'Drop files here or click to add'}
  </button>
)}
```

---

### ⑤ Track Area Drag & Drop (Future)
**Location:** Main track area / timeline  
**Status:** Not implemented yet (Phase 10-12)  
**Planned Features:**
- Drag onto timeline → Upload + position at drop location
- Drag onto specific track → Upload + assign to that track
- Visual preview of where file will be placed
- Pro DAW workflow

---

## Upload State Indicators

### Button States

#### Normal
```
┌───────────────┐
│ + Add Object  │  ← Clickable, blue gradient hover
└───────────────┘
```

#### Uploading
```
┌───────────────┐
│ ⟳ Uploading..│  ← Spinner, disabled, gray
└───────────────┘
```

#### Error
```
┌───────────────┐
│ + Add Object  │  ← Re-enabled
└───────────────┘
  ⚠ Upload failed  ← Error message below
```

---

### Toast Notifications

#### Uploading
```
┌────────────────────────────┐
│ ⟳ Uploading...             │
│ my-song.mp3                │
│ [████████████░░░] 80%      │
└────────────────────────────┘
```

#### Success
```
┌────────────────────────────┐
│ ✓ Upload complete          │
│ my-song.mp3                │
└────────────────────────────┘
(Auto-dismisses after 3 seconds)
```

#### Error
```
┌────────────────────────────┐
│ ✗ Upload failed         [×]│
│ Network error              │
└────────────────────────────┘
(Auto-dismisses after 5 seconds)
```

---

### Drag Overlay

#### Active (dragging over panel)
```
┌─────────────────────────────┐
│  ┌──────────────────────┐   │
│  │   ⬆                  │   │
│  │ Drop audio files     │   │
│  │    to upload         │   │
│  └──────────────────────┘   │
│                             │
│  (Blue gradient, z-50)      │
└─────────────────────────────┘
```

#### Inactive
```
┌─────────────────────────────┐
│                             │
│  Normal panel content       │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

---

## Multi-File Upload

When multiple files are selected or dropped:

```
User selects 3 files: song1.mp3, song2.mp3, song3.mp3

Sequential upload:
  1. song1.mp3→ Upload → ✓ Added to tree
  2. song2.mp3 → Upload → ✓ Added to tree  
  3. song3.mp3 → Upload → ✓ Added to tree

All 3 objects appear in tree when complete.
```

Toast shows current file being uploaded:
```
⟳ Uploading...
song1.mp3
[████░░░░░░] 40%

(After song1 completes)

⟳ Uploading...
song2.mp3
[██░░░░░░░░] 20%

... and so on
```

---

## Keyboard Shortcuts (Future)

Not yet implemented, but planned:

- `Cmd/Ctrl + U` → Open file picker
- `Cmd/Ctrl + V` → Paste from clipboard (if audio)
- Drag from external app → Same as file drag & drop

---

## Mobile/Touch Support (Future)

Not in MVP, but considerations:

- File picker still works on mobile
- Drag & drop not supported on touch devices
- Alternative: "Choose Files" button with camera option
- Upload from cloud storage (Dropbox, Google Drive)

---

## Testing Scenarios

### Scenario 1: First-Time User
1. User creates new project
2. Sees empty state: "No objects yet"
3. Clicks "Drop files here or click to add"
4. File picker opens
5. Selects audio file
6. Toast shows upload progress
7. Object appears in tree
8. **Success!** User understands how to add audio

### Scenario 2: Power User
1. User has multiple audio files to upload
2. Selects all 10 files in desktop
3. Drags onto object panel
4. Blue overlay appears
5. Drops files
6. All 10 files upload sequentially
7. All objects appear in tree
8. **Fast workflow!**

### Scenario 3: Error Recovery
1. User tries to upload while backend is down
2. Toast shows "Upload failed"
3. Error message: "Network error"
4. User starts backend server
5. Clicks "Add Object" again
6. Upload succeeds this time
7. **Graceful error handling!**

---

## Developer Tips

### Adding a New Entry Point

```typescript
// 1. Import the hook
import { useAudioUpload, openFilePicker } from '@/features/audio-upload';

// 2. Use in component
const { uploadFile, uploadState } = useAudioUpload(projectId);

// 3. Create handler
const handleUpload = async () => {
  const files = await openFilePicker({ multiple: true });
  for (const file of files) {
    await uploadFile(file, parentId);
  }
};

// 4. Add to UI
<button onClick={handleUpload} disabled={uploadState.isUploading}>
  Upload Audio
</button>
```

### Customizing Toast Position

```tsx
// Default: bottom-right
<UploadToast uploadState={uploadState} />

// Custom position (modify UploadToast.tsx):
className="fixed top-4 right-4 ..."  // top-right
className="fixed bottom-4 left-4 ..." // bottom-left
```

### Handling Upload Success

```typescript
const handleUpload = async (file: File) => {
  try {
    await uploadFile(file);
    // Success! Object is already in tree
    console.log('Upload complete');
  } catch (error) {
    // Error is in uploadState.error
    console.error('Upload failed:', error);
  }
};
```

---

## Accessibility

- ✅ Buttons have `aria-label` attributes
- ✅ File picker is keyboard accessible (Tab + Enter)
- ✅ Toast notifications are announced to screen readers (role="status")
- ✅ Drag & drop has keyboard alternative (buttons)
- ✅ Error messages are associated with controls

---

## Browser Compatibility

- ✅ Chrome/Edge (Chromium) 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠ IE 11 not supported (uses modern APIs)

Features used:
- `File API` - All modern browsers
- `Drag & Drop API` - All modern browsers
- `Fetch API` - All modern browsers
- `React Hooks` - Requires React 16.8+

---

**Ready to test all entry points!** Try each one to see which feels most natural for your workflow.
