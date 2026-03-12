# AI Music Agent - Architecture Diagram

Visual guide to understanding the frontend architecture.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Marketing │  │ Studio Shell │  │   Project Workspace     │ │
│  │   Pages    │  │  (Layout)    │  │  (Object Tree + Tracks) │ │
│  └────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE MODULES                              │
│  ┌──────────┐ ┌───────┐ ┌────────┐ ┌──────┐ ┌────────────┐    │
│  │  Object  │ │ Tools │ │ Tracks │ │Views │ │  Playback  │    │
│  │   Tree   │ │(Tools)│ │ (Proj) │ │(Rndr)│ │  (Audio)   │    │
│  └──────────┘ └───────┘ └────────┘ └──────┘ └────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Object Tree Store│  │ Playback State   │  │ UI State     │ │
│  │    (Zustand)     │  │   (Zustand)      │  │ (Local)      │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Adapters                              │  │
│  │  (Transform API DTOs ↔ App Domain Models)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Client                             │  │
│  │  (Typed HTTP calls to FastAPI backend)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                            │
│  Endpoints: /api/audio, /api/jobs, /api/chat                   │
│  Processing: Demucs (stems), basic-pitch (MIDI)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## The 4 Core Primitives

### Visual Representation

```
PROJECT (root)
    │
    ├─ tempo: 120
    ├─ key: "Am"
    ├─ timeSignature: 4/4
    │
    └─ OBJECT TREE
        │
        ├─ MusicalObject: song.wav (Audio)
        │   ├─ MusicalObject: vocals.wav (Audio) ← child
        │   ├─ MusicalObject: bass.wav (Audio) ← child
        │   │   └─ MusicalObject: bass.mid (MIDI) ← grandchild
        │   ├─ MusicalObject: drums.wav (Audio) ← child
        │   └─ MusicalObject: other.wav (Audio) ← child
        │
        └─ TOOLS operate on objects
            │
            ├─ Tool: SeparateStems
            │   Input: Audio → Output: Stems (children)
            │
            └─ Tool: ConvertToMIDI
                Input: Audio → Output: MIDI (child)

VIEWS render objects
    │
    ├─ WaveformView → renders Audio objects
    ├─ MIDIView → renders MIDI objects
    └─ SheetView → renders MIDI as notation

TRACKS = projections of selected objects from tree
```

---

## Data Flow: Tool Execution

```
1. USER INTERACTION
   Right-click object in ObjectPanel → Select "Separate Stems"
                    ↓
2. FRONTEND TOOL EXECUTION
   useToolExecution() hook
                    ↓
   Tool.execute(object)
                    ↓
3. API CLIENT CALL
   POST /api/jobs/separate_stems
   Body: { audio_id: "audio-123" }
                    ↓
4. BACKEND CREATES JOB
   FastAPI → Celery → Demucs processing
                    ↓
5. FRONTEND POLLS JOB STATUS
   GET /api/jobs/{job_id}
   Every 2 seconds until status = 'completed'
                    ↓
6. ADAPTER TRANSFORMS RESULT
   JobDTO → MusicalObject[]
   (4 stem children: vocals, bass, drums, other)
                    ↓
7. STATE UPDATE
   addObject(stemObject, parentId: "audio-123")
   Object tree store updates
                    ↓
8. UI UPDATES
   ObjectPanel re-renders
   New stem objects appear in tree
```

---

## UI Layout Zones

```
┌───────────────────────────────────────────────────────────────────┐
│  APP BAR                                                          │
│  [☰] AI Music Agent        My Project        [Get Pro]  [Avatar] │
├───────────────────────────────────────────────────────────────────┤
│  TRANSPORT BAR                                                    │
│  [▶️ ⏭️ 🔁]  00:00.0  [🎼 4/4 Am]                                  │
├──────────────────┬────────────────────────────────────────────────┤
│  OBJECT PANEL    │  TRACK AREA                                    │
│                  │  ┌────────────────────────────────────────┐    │
│  + Add File      │  │ [🌊 Waveform] [🎹 MIDI] [🎼 Sheet]     │    │
│  > song.wav   ●  │  ├────────────────────────────────────────┤    │
│    > vocals.wav  │  │ Timeline: 0s──1s──2s──3s──4s──5s────   │    │
│    > bass.wav    │  ├────────────────────────────────────────┤    │
│      > bass.mid  │  │ Track 1: song.wav    [M][S][H]         │    │
│    > drums.wav   │  │ ▓▓▓▓░░░▓▓▓░░▓▓░░▓▓▓▓░░░░▓▓▓░░░        │    │
│    > other.wav   │  ├────────────────────────────────────────┤    │
│                  │  │ Track 2: bass.wav    [M][S][H]         │    │
│                  │  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      │    │
│                  │  └────────────────────────────────────────┘    │
└──────────────────┴────────────────────────────────────────────────┘
```

### Zone Responsibilities

| Zone | Purpose | Key Components |
|------|---------|----------------|
| **App Bar** | Navigation, branding, user menu | AppBar, UserMenu |
| **Transport Bar** | Playback controls, project metadata | TransportBar, TransportControls |
| **Object Panel** | Object tree source of truth | ObjectPanel, ObjectTreeNode |
| **Track Area** | Visual rendering of objects | TrackArea, TrackList, Renderers |

---

## Component Hierarchy

```
app/
├── (marketing)/
│   └── layout.tsx
│       └── page.tsx
│           └── Hero, FeatureSection, Footer
│
└── (studio)/
    └── layout.tsx
        ├── AppBar
        │   └── UserMenu
        ├── TransportBar
        │   ├── TransportControls
        │   └── TimeDisplay
        └── StudioLayout
            ├── ObjectPanel (left)
            │   ├── FileUpload
            │   └── ObjectTreeNode (recursive)
            │       └── ObjectIcon
            └── TrackArea (right)
                ├── ViewModeSwitcher
                ├── TimelineRuler
                └── TrackList
                    └── TrackController (wrapper)
                        ├── TrackHeader
                        └── [Renderer children]
                            ├── WaveformRenderer
                            ├── MidiRenderer
                            └── SheetMusicRenderer
```

---

## State Management Strategy

### Global State (Zustand)

```typescript
// Object Tree Store
{
  objects: Record<string, MusicalObject>
  rootId: string | null
  selectedIds: string[]
  
  addObject(object, parentId?)
  removeObject(id)
  updateObject(id, updates)
  selectObject(id, multi?)
}

// Playback Store
{
  isPlaying: boolean
  currentTime: number
  tracks: TrackState[]
  
  play()
  pause()
  seek(time)
  setTrackMute(id, muted)
}
```

### Local State (useState)

- UI toggles (menu open/closed)
- Form inputs
- Hover states
- Temporary selections

**When to use which:**
- Use Zustand if multiple components need the same data
- Use useState if only one component needs it

---

## Tool System Architecture

### Tool Interface

```typescript
interface Tool {
  id: string
  name: string
  description: string
  icon: string
  inputTypes: ObjectType[]
  outputType: ObjectType
  execute: (input: MusicalObject, params?) => Promise<MusicalObject>
}
```

### Tool Registry Pattern

```typescript
// Tool definitions are independent modules
const separateStemsTool: Tool = { ... }
const convertToMidiTool: Tool = { ... }

// Registry manages all tools
toolRegistry.register(separateStemsTool)
toolRegistry.register(convertToMidiTool)

// Get applicable tools for an object
const tools = toolRegistry.getToolsForObjectType(ObjectType.Audio)
// Returns: [separateStemsTool, convertToMidiTool]
```

### Tool Execution Flow

```
User Action
    ↓
ContextMenu or CommandPalette
    ↓
useToolExecution()
    ↓
tool.execute(object)
    ↓
API call → Backend job
    ↓
Poll job status
    ↓
JobDTO → Adapter → MusicalObject[]
    ↓
Update object tree store
    ↓
UI updates automatically (React)
```

---

## View Rendering Architecture

### Shared Controller, Different Renderers

```
TrackController (shared logic)
    │
    ├─ Track header (name, M/S/H buttons)
    ├─ Volume slider
    ├─ Selection state
    └─ Children = Renderer
        │
        ├─ WaveformRenderer
        │   Uses Canvas API
        │   Props: audioData, zoom, scrollX
        │
        ├─ MidiRenderer
        │   Uses Canvas API + PianoKeyboard
        │   Props: notes, zoom, scrollX, scrollY
        │
        └─ SheetMusicRenderer
            Uses VexFlow
            Props: notes, timeSignature, keySignature
```

**Key Insight:** All three renderers receive the **same MusicalObject** but render it differently.

---

## API Integration Layers

### Layer 1: API Client

```typescript
// src/api-client/client.ts
export class ApiClient {
  async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new ApiError(...)
    return response.json()
  }
}
```

### Layer 2: Endpoint Functions

```typescript
// src/api-client/endpoints/jobs.ts
export async function createStemSeparationJob(
  audioId: string
): Promise<{ job_id: string }> {
  const client = new ApiClient(API_BASE_URL)
  return client.post('/api/jobs/separate_stems', { audio_id: audioId })
}
```

### Layer 3: Adapters

```typescript
// src/adapters/musical-object.ts
export function jobToMusicalObject(job: JobDTO): MusicalObject {
  // Transform API shape to app domain model
  return {
    id: job.input_audio_id,
    children: job.result.artifacts.map(toMusicalObject),
    ...
  }
}
```

### Layer 4: App Code

```typescript
// src/features/tools/definitions/separate-stems-tool.ts
async execute(input: MusicalObject): Promise<MusicalObject> {
  const { job_id } = await createStemSeparationJob(input.id)
  const job = await pollJobUntilComplete(job_id)
  return jobToMusicalObject(job)  // Clean MusicalObject
}
```

---

## Routing Structure

```
/ (root)
├── (marketing)/
│   ├── page.tsx              → /
│   ├── pricing/
│   │   └── page.tsx          → /pricing
│   └── about/
│       └── page.tsx          → /about
│
└── (studio)/
    ├── page.tsx              → /studio (project list)
    └── project/
        └── [id]/
            └── page.tsx      → /studio/project/123
```

**Route Groups:**
- `(marketing)` - Simple layout, landing pages
- `(studio)` - Complex layout, workspace

---

## File Organization Principles

### 1. Co-location
Keep related files together:
```
features/waveform/
  ├── WaveformRenderer.tsx
  ├── useWaveformCanvas.ts
  └── waveform-utils.ts
```

### 2. Feature Folders
Each feature is self-contained:
```
features/tools/
  ├── components/
  ├── hooks/
  ├── services/
  └── types/
```

### 3. Shared vs Specific
- `src/components/ui/` - Shared across features
- `src/features/*/components/` - Feature-specific

### 4. Types Location
- Core domain types → `src/types/`
- API types → `src/api-client/types.ts`
- Feature types → `src/features/*/types/`

---

## Development Workflow

```
1. Read DEVELOPMENT_PLAN.md
   Understand the phase you're working on
        ↓
2. Copy prompt from CURSOR_PROMPTS.md
   Get the exact prompt for that phase
        ↓
3. Paste into Cursor
   Let Cursor generate the code
        ↓
4. Review the code
   Check for TypeScript errors
   Verify it matches the architecture
        ↓
5. Test in browser
   npm run dev
   Manually verify feature works
        ↓
6. Commit
   git add . && git commit -m "Phase X: Feature name"
        ↓
7. Move to next phase
   Repeat from step 1
```

---

## Testing Strategy

### Unit Tests
```typescript
// tests/unit/object-tree.test.ts
describe('Object Tree Store', () => {
  it('should add object to tree', () => {
    const store = useObjectTreeStore.getState()
    store.addObject(mockObject)
    expect(store.objects[mockObject.id]).toBeDefined()
  })
})
```

### Integration Tests
```typescript
// tests/integration/tool-execution.test.ts
describe('Tool Execution', () => {
  it('should execute tool and update tree', async () => {
    const result = await executeTool(tool, object)
    expect(result.children).toHaveLength(4)  // 4 stems
  })
})
```

### E2E Tests (Future)
- Upload file → Apply tool → Verify result
- Create project → Add objects → Play audio

---

## Performance Considerations

### 1. Canvas Rendering
- Use `requestAnimationFrame` for smooth animation
- Debounce zoom/scroll events
- Pre-calculate waveform peaks for large files

### 2. Large Object Trees
- Virtualize long lists (react-window)
- Lazy load audio data
- Paginate job history

### 3. Audio Playback
- Preload audio buffers
- Use Web Audio API efficiently
- Handle multiple tracks with GainNodes

---

## Deployment Architecture

```
Production Environment:

┌─────────────────────────────────────────┐
│  Vercel (Frontend)                      │
│  - Next.js static + SSR                 │
│  - CDN for assets                       │
│  - Edge functions                       │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Backend API (FastAPI)                  │
│  - EC2 or DigitalOcean                  │
│  - Celery workers                       │
│  - PostgreSQL database                  │
│  - S3 for audio storage                 │
└─────────────────────────────────────────┘
```

---

## Summary

This architecture is designed for:
- ✅ **Modularity** - Easy to add new tools/views
- ✅ **Scalability** - Handles large projects
- ✅ **Maintainability** - Clear separation of concerns
- ✅ **Testability** - Each module can be tested independently
- ✅ **Cursor-friendly** - Clear boundaries for AI assistance

**The key principle:** Object tree is the source of truth. Everything else is a projection or transformation of that data.
