# Drag & Drop Investigation & Fix

## Root Cause Analysis

### Problem
Users could not drag audio objects into the viewer/tracks.

### Investigation Steps

1. **Checked Component Chain** ✓
   - AudioEngineDemo → AudioViewer → TrackList → Track
   - All components exist and are properly connected
   - Event handlers are properly passed down

2. **Checked Drag Handlers** ✓
   - TreeNode sets `draggable={true}` for audio objects
   - TreeNode sets drag data with `application/json` MIME type
   - Track component has `onDragOver`, `onDragLeave`, and `onDrop` handlers
   - Drag data is properly parsed and validated

3. **Checked Playhead** ✓
   - Playhead component exists and renders
   - Shows vertical line at current time position
   - Has visual handle at top

4. **Found Critical Bug** ❌
   **Tracks were not being created!**
   
   In `AudioEngineDemo.tsx`, line 79:
   ```typescript
   if (!engine || !isInitialized || !projectId) return;
   ```
   
   This meant:
   - Tracks only created when engine is initialized
   - Engine only initializes on first play (user gesture required)
   - Without tracks, there's nothing to drag objects TO
   - Catch-22 situation: can't drag until tracks exist, but tracks don't exist until play clicked

## The Fix

### Changes Made to AudioEngineDemo.tsx

**1. Separate Track Creation from Audio Loading**
   - Tracks are now created IMMEDIATELY when audio objects are available
   - Audio loading is DEFERRED until engine initializes
   - This allows users to see tracks and drag to them before clicking play

**2. Updated useEffect for Track Creation**
   ```typescript
   // OLD (broken):
   if (!engine || !isInitialized || !projectId) return;
   
   // NEW (works):
   if (!engine || !projectId) return;
   // Tracks created immediately
   // Audio only loaded if (isInitialized)
   ```

**3. Updated handleClipAdd**
   - Clips can be added to tracks even if engine not initialized
   - Audio loading only happens if engine is initialized
   - Session state updated immediately for visual feedback

**4. Updated initializeAudioContext**
   - When engine initializes, it loads the current session
   - This includes any tracks/clips added before initialization

## New Flow

### Without Audio Engine Initialized
1. User uploads audio files
2. **Tracks created immediately** (NEW!)
3. User can see tracks in viewer
4. User can drag audio objects to tracks
5. Clips are added to session state (visual only)

### After First Play Click
6. User clicks play button
7. AudioContext initializes (user gesture satisfied)
8. Engine loads session with all tracks and clips
9. Audio assets are loaded and decoded
10. Playback begins

## Component Verification

### ✅ AudioEngineDemo
- Creates engine instance on mount
- Creates tracks from uploaded audio
- Handles clip addition
- Initializes engine on first play

### ✅ AudioViewer
- Renders track area with scrolling
- Shows playhead at current time
- Passes handlers to TrackList

### ✅ TrackList
- Maps over tracks array
- Renders Track component for each
- Passes clip add handler with trackId injection

### ✅ Track
- Shows track header (controls)
- Shows clip area (drop zone)
- Handles drag over/leave/drop events
- Parses JSON drag data
- Calculates drop position in timeline
- Calls onClipAdd callback

### ✅ TreeNode
- Makes audio objects draggable
- Sets drag data as JSON
- Includes object id, name, type, metadata

### ✅ Playhead
- Positioned at currentTime * pixelsPerSecond
- Vertical cyan line
- Small handle at top
- Spans full track height

### ✅ DropZone (File Upload)
- Now ignores internal drags (audio objects)
- Only activates for file uploads from OS
- Checks for 'Files' type in dataTransfer

## Testing Checklist

- [ ] Upload audio file - track appears immediately
- [ ] Upload multiple files - multiple tracks appear
- [ ] Drag audio object from tree to track - drop zone highlights
- [ ] Drop audio object on track - clip appears on timeline
- [ ] Drop position corresponds to mouse X position
- [ ] Clip shows waveform (if available)
- [ ] Click play - audio engine initializes
- [ ] Playback works with dragged clips
- [ ] Drag file from OS to panel - DropZone activates
- [ ] Drag audio object to panel - DropZone does NOT activate
- [ ] Playhead moves during playback

## Key Files Modified

1. `/frontend/app/(studio)/project/[id]/_components/AudioEngineDemo.tsx`
   - Separated track creation from engine initialization
   - Updated handleClipAdd to work without initialization
   - Updated initializeAudioContext to load existing session

## Browser Console Debugging

If still not working, check:

```javascript
// Check if tracks exist
console.log('Tracks:', session.tracks);

// Check drag data
e.dataTransfer.items.forEach((item) => {
  console.log('Drag type:', item.type);
});

// Check if drop handler is called
console.log('Drop event received:', e);
```

## Expected Behavior

1. **Tracks visible** - As soon as you upload audio
2. **Drag works** - Object can be dragged from tree
3. **Drop zone lights up** - When hovering over track
4. **Clip appears** - When dropped on track
5. **Play initializes** - First click of play button
6. **Audio plays** - After initialization complete
