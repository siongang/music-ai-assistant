# Audio Upload Feature

Comprehensive audio file upload system with multiple entry points and visual feedback.

## Architecture

```
audio-upload/
├── hooks/
│   └── useAudioUpload.ts      # Main upload logic hook
├── components/
│   ├── DropZone.tsx            # Drag & drop wrapper
│   └── UploadToast.tsx         # Upload progress notification
├── utils/
│   └── file-picker.ts          # File picker utilities
└── index.ts                    # Public exports
```

## Features

### Multiple Upload Entry Points

1. **"Add Object" Button**
   - Click button in object panel → File picker opens
   - Supports multi-file selection
   - Most explicit and discoverable

2. **Drag & Drop on Object Panel**
   - Drag audio files from desktop
   - Drop on object panel area
   - Visual overlay feedback during drag
   - Fast workflow for power users

3. **Header "Upload" Button**
   - Always accessible toolbar button
   - Same file picker as "Add Object"
   - Highlighted with gradient styling

4. **Empty State CTA**
   - When no objects exist
   - Click to trigger upload
   - Good onboarding UX

### Upload Workflow

```
File Selection (any entry point)
    ↓
File Validation (MP3/WAV only)
    ↓
POST /projects/{project_id}/audio
    ↓
Adapter: AudioUploadResponse → AudioObject
    ↓
Store: addObject(object, parentId)
    ↓
UI: Toast notification + object appears in tree
```

### Visual Feedback

- **Upload button**: Shows spinner during upload, disabled state
- **Toast notification**: Progress bar, success/error states, auto-dismisses
- **Error display**: Inline error message in panel footer
- **Drag overlay**: Blue highlight with icon when dragging files

## Usage

### In a Component

```tsx
import { useAudioUpload, openFilePicker, DropZone, UploadToast } from '@/features/audio-upload';

function MyComponent({ projectId }: { projectId: string }) {
  const { uploadFile, uploadState } = useAudioUpload(projectId);
  const [filename, setFilename] = useState<string | null>(null);

  // Method 1: File picker
  const handleClick = async () => {
    const files = await openFilePicker({ multiple: true });
    for (const file of files) {
      setFilename(file.name);
      await uploadFile(file);
    }
  };

  // Method 2: Drag & drop
  const handleDrop = async (files: File[]) => {
    for (const file of files) {
      setFilename(file.name);
      await uploadFile(file);
    }
  };

  return (
    <>
      <button onClick={handleClick}>Upload</button>
      
      <DropZone onFilesDropped={handleDrop}>
        <div>Drop files here</div>
      </DropZone>
      
      <UploadToast uploadState={uploadState} filename={filename} />
    </>
  );
}
```

## API Reference

### `useAudioUpload(projectId)`

Main upload hook.

**Returns:**
- `uploadFile(file, parentId?)`: Function to upload a file
- `uploadState`: Current upload state
  - `isUploading: boolean`
  - `progress: number` (0 to 1)
  - `error: string | null`
- `resetUpload()`: Clear upload state

### `openFilePicker(options?)`

Open native file picker dialog.

**Options:**
- `accept?: string` - File types (default: 'audio/mpeg,audio/wav,.mp3,.wav')
- `multiple?: boolean` - Allow multiple files (default: false)

**Returns:** `Promise<File[]>`

### `<DropZone>`

Wrapper component for drag & drop.

**Props:**
- `onFilesDropped: (files: File[]) => void` - Callback when files dropped
- `children: ReactNode` - Wrapped content
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable drop zone
- `showOverlay?: boolean` - Show blue overlay during drag (default: true)

### `<UploadToast>`

Upload progress notification.

**Props:**
- `uploadState: UploadState` - Upload state from hook
- `filename?: string` - File being uploaded (optional)

## File Validation

Accepted formats:
- **MIME types**: `audio/mpeg`, `audio/wav`, `audio/mp3`, `audio/x-wav`
- **Extensions**: `.mp3`, `.wav`

Invalid files are rejected with error message in `uploadState.error`.

## Error Handling

Errors are captured in `uploadState.error`:
- Invalid file type
- Network errors
- API errors
- Upload failures

Toast notification shows error with auto-dismiss after 5 seconds.

## Integration with Object Tree

Uploaded files are automatically added to the object tree:

1. API returns `{ audio_id, filename, ... }`
2. Adapter converts to `AudioObject` with metadata
3. Store's `addObject()` adds to tree and marks dirty
4. Object appears in panel immediately
5. Tree is saved to backend on unmount

## Future Enhancements

### Short Term
- [ ] Upload progress from server (streaming)
- [ ] Multiple concurrent uploads
- [ ] Upload queue management
- [ ] File size validation (warn on large files)
- [ ] Duplicate file detection

### Medium Term
- [ ] Upload to specific parent (drag onto folder)
- [ ] Paste from clipboard
- [ ] Keyboard shortcut (Cmd/Ctrl+U)
- [ ] Batch operations (upload folder)

### Long Term
- [ ] URL import (paste SoundCloud/YouTube URL)
- [ ] Cloud storage integration (Dropbox, Google Drive)
- [ ] Recording directly in app
- [ ] Drag & drop onto timeline with position

## Testing

To test the upload system:

1. **Start backend**: `cd backend && uvicorn app.main:app --reload`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Create project**: Go to `/studio` → "New Project"
4. **Test entry points**:
   - Click "Add Object" button
   - Click "Upload" button in header
   - Drag audio file onto object panel
   - Click empty state message

Expected: File uploads, toast appears, object shows in tree.

## Troubleshooting

### Upload button doesn't work
- Check console for errors
- Verify backend is running (`http://localhost:8000/api/docs`)
- Check project ID is valid

### Files not appearing in tree
- Check `uploadState.error` for API errors
- Verify `addObject()` is being called
- Check browser console for store errors

### Drag & drop not working
- Ensure files are audio (MP3/WAV)
- Check `isAudioFile()` validation logic
- Verify DropZone is wrapping the target area

### Toast not showing
- Check `uploadState` is being updated
- Verify UploadToast component is rendered
- Check z-index conflicts (toast is z-50)
