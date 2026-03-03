# Audio Engine Fixes

## Issues Fixed

### 1. AudioContext Initialization Error
**Problem**: The AudioContext was being automatically initialized on component mount, but browsers require a user gesture to start the AudioContext due to autoplay policies. This resulted in the error:
```
The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
```

**Solution**: 
- Changed initialization to be **lazy** - the AudioContext is now only initialized when the user clicks the play button for the first time
- Modified `AudioEngineDemo.tsx` to:
  - Create the `AudioEngine` instance on mount (without initializing AudioContext)
  - Add `initializeAudioContext()` function that gets called on first play
  - Updated `handlePlay()` to trigger initialization if not already done
- Added visual feedback in `TransportBar.tsx` showing "Click play to start audio engine" when not initialized

**Files Changed**:
- `/frontend/app/(studio)/project/[id]/_components/AudioEngineDemo.tsx`
- `/frontend/src/components/project/TransportBar.tsx`

### 2. DropZone Conflict with Object Dragging
**Problem**: When dragging audio objects from the object tree to tracks, the DropZone component (designed for file uploads) was incorrectly lighting up and treating it as a file upload operation.

**Solution**:
- Updated `DropZone.tsx` to differentiate between:
  - **External drags** (file uploads from file system) - have `'Files'` in `dataTransfer.types`
  - **Internal drags** (audio objects) - only have `'application/json'` in `dataTransfer.types`
- Modified drag event handlers to check for `'Files'` type before activating drop zone
- Set appropriate `dropEffect` based on drag type

**Files Changed**:
- `/frontend/src/features/audio-upload/components/DropZone.tsx`

## Technical Details

### AudioContext Initialization Flow

**Before**:
```typescript
useEffect(() => {
  const audioEngine = new AudioEngine();
  audioEngine.init();  // ❌ Fails - no user gesture
  setEngine(audioEngine);
}, []);
```

**After**:
```typescript
useEffect(() => {
  const audioEngine = new AudioEngine();
  setEngine(audioEngine);  // ✓ Just create instance
}, []);

const handlePlay = async () => {
  if (!isInitialized) {
    await initializeAudioContext();  // ✓ Initialize on first play
  }
  engine.play();
};
```

### Drag Type Detection

**Key Check**:
```typescript
const hasFiles = e.dataTransfer.types.includes('Files');

if (!hasFiles) {
  // This is an internal drag (audio object), not a file upload
  return;
}
```

**Drag Sources**:
- **File upload** (from OS): `types = ['Files']`
- **Audio object** (internal): `types = ['application/json']`

## Benefits

1. **AudioContext now works properly** - initializes on user gesture as required by browsers
2. **No more false positives** - DropZone only activates for actual file uploads
3. **Better UX** - Clear visual feedback for audio engine status
4. **Seamless drag-and-drop** - Audio objects can be dragged to tracks without interference

## Testing Checklist

- [ ] Click play button - audio engine initializes successfully
- [ ] Drag audio file from file system to object panel - DropZone lights up
- [ ] Drag audio object from tree to track - DropZone does NOT light up
- [ ] Audio objects can be added to tracks via drag-and-drop
- [ ] Upload audio files via drag-and-drop to object panel
- [ ] Transport bar shows "Click play to start audio engine" message initially
