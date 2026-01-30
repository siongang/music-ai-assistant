# Cursor Prompts - AI Music Agent Frontend

This document contains **ready-to-use prompts** for each development phase. Copy these into Cursor to build the frontend systematically.

---

## How to Use This Document

1. Open a new Cursor chat/composer session
2. Copy the prompt for your current phase
3. Paste into Cursor
4. Review the generated code
5. Test in the browser
6. Move to the next phase

**Important:** Complete phases in order. Each phase builds on previous work.

**Styling:** Use **DESIGN_SYSTEM.md** for all UI: pure black (`bg-black`) main background, `border-zinc-900` or `border-zinc-800/50`, cyan accents (`cyan-500`/`cyan-400`, gradient `from-cyan-500 to-blue-600`). Do not use old refs like `#0A0A0A` or `bg-zinc-950` for main backgrounds.

---

## Phase 1: Type System & Domain Models

### Prompt 1A: Core Types

```
I'm building the type system for a music workstation app called "AI Music Agent".

Context:
- Next.js 15 + TypeScript + App Router
- Domain model: Project, MusicalObject, Tool, View (4 core primitives)
- MusicalObjects form a hierarchical tree (parent/child relationships)
- Tools transform objects into new objects
- Views render objects without owning data

Task:
Create TypeScript types for the 4 core primitives in separate files.

1. src/types/musical-object.ts:
   - ObjectType enum: Audio, Midi, Sheet, Stems
   - MusicalObject interface:
     - id: string
     - name: string
     - type: ObjectType
     - parentId: string | null
     - children: MusicalObject[]
     - metadata: Record<string, any>
     - createdAt: Date
     - updatedAt: Date
   - Helper types: AudioObject, MidiObject (extend MusicalObject)

2. src/types/project.ts:
   - Project interface:
     - id: string
     - name: string
     - tempo: number
     - key: string (e.g., "Am", "C#")
     - timeSignature: { numerator: number; denominator: number }
     - rootObject: MusicalObject | null
     - createdAt: Date
     - updatedAt: Date

3. src/types/tool.ts:
   - ToolType enum: SeparateStems, ConvertToMidi, AnalyzeKey
   - Tool interface:
     - id: string
     - name: string
     - description: string
     - icon: string (icon name or emoji)
     - inputTypes: ObjectType[]
     - outputType: ObjectType
     - execute: (input: MusicalObject, params?: any) => Promise<MusicalObject>

4. src/types/view.ts:
   - ViewMode enum: Waveform, Midi, Sheet
   - ViewConfig interface:
     - mode: ViewMode
     - zoom: number
     - scrollX: number
     - scrollY: number

5. src/types/index.ts:
   - Re-export all types

Use strict TypeScript. Add JSDoc comments for clarity.
```

---

## Phase 2: API Client Layer

### Prompt 2A: Base HTTP Client

```
I'm building Phase 2: API Client for the FastAPI backend.

Context:
- Backend is at http://localhost:8000 (FastAPI)
- Need typed API client with error handling
- Endpoints: /api/jobs, /api/audio, /api/chat
- Types are in src/types/

Task:
Create a base HTTP client with proper error handling.

1. src/api-client/config.ts:
   - Export API_BASE_URL (default: http://localhost:8000)
   - Export DEFAULT_TIMEOUT (30000ms)

2. src/api-client/client.ts:
   - Create ApiClient class or functions
   - Methods: get, post, put, delete
   - Accept generic type for response
   - Include Authorization header support (empty for now)
   - Handle errors gracefully (throw ApiError with status, message)
   - Add request timeout

3. src/api-client/types.ts:
   - ApiError interface
   - JobDTO interface (id, status, type, result, error)
   - AudioUploadResponse interface
   - ChatMessageDTO interface

Example usage:
```typescript
const client = new ApiClient(API_BASE_URL)
const job = await client.get<JobDTO>(`/api/jobs/${jobId}`)
```

Use fetch API, not axios. TypeScript strict mode.
```

### Prompt 2B: Endpoint Wrappers

```
Continue Phase 2: Create endpoint-specific API functions.

Context:
- Base client is in src/api-client/client.ts
- DTOs are in src/api-client/types.ts
- Backend endpoints documented in backend/app/api/endpoints/

Task:
Create typed endpoint functions for jobs, audio, chat.

1. src/api-client/endpoints/jobs.ts:
   - getJob(jobId: string): Promise<JobDTO>
   - pollJobUntilComplete(jobId: string, interval?: number): Promise<JobDTO>
   - listJobs(): Promise<JobDTO[]>

2. src/api-client/endpoints/audio.ts:
   - uploadAudio(file: File, projectId: string): Promise<AudioUploadResponse>
   - downloadAudio(objectId: string): Promise<Blob>
   - getAudioMetadata(objectId: string): Promise<AudioMetadata>

3. src/api-client/endpoints/chat.ts:
   - sendMessage(projectId: string, message: string): Promise<ChatMessageDTO>
   - getChatHistory(projectId: string): Promise<ChatMessageDTO[]>

Each function should:
- Use the base client
- Have proper TypeScript types
- Include JSDoc comments
- Handle errors

Export all functions as named exports.
```

---

## Phase 3: Adapters

### Prompt 3A: API to App Model Adapters

```
Phase 3: Create adapters to transform API DTOs into app domain models.

Context:
- API types in src/api-client/types.ts
- App types in src/types/
- Need clean separation between API shape and app logic

Task:
Create adapter functions that convert between API and app models.

1. src/adapters/musical-object.ts:
   - jobToMusicalObject(job: JobDTO): MusicalObject
     - Map job.result to MusicalObject fields
     - Handle different job types (separate_stems, to_midi)
   - musicalObjectToApi(object: MusicalObject): any
     - Convert app model back to API format (if needed)

2. src/adapters/job.ts:
   - jobDtoToJobStatus(dto: JobDTO): JobStatus
     - Create simpler JobStatus type if needed
     - Map status strings to enums

3. src/adapters/project.ts:
   - apiProjectToProject(apiProject: any): Project
   - projectToApiProject(project: Project): any

All functions should:
- Handle null/undefined gracefully
- Provide default values
- Be pure functions (no side effects)
- Include TypeScript type guards if needed

Add unit tests if time permits (use Vitest).
```

---

## Phase 4: Object Tree State Management

### Prompt 4A: Zustand Store

```
Phase 4: Create the object tree state management system.

Context:
- Object tree is the single source of truth
- Hierarchical structure (parent-child)
- Support: add, remove, update, select objects
- Types are in src/types/musical-object.ts

Task:
Create a Zustand store for the object tree.

1. src/features/object-tree/store/object-tree-store.ts:
   - State:
     - objects: Record<string, MusicalObject> (flat map for fast lookup)
     - rootId: string | null
     - selectedIds: string[]
   - Actions:
     - addObject(object: MusicalObject, parentId?: string): void
     - removeObject(id: string): void (also remove children)
     - updateObject(id: string, updates: Partial<MusicalObject>): void
     - selectObject(id: string, multi?: boolean): void
     - clearSelection(): void
     - getObject(id: string): MusicalObject | null
     - getChildren(parentId: string): MusicalObject[]
     - getRootObjects(): MusicalObject[]
   - Use immer for immutable updates

2. src/features/object-tree/hooks/useObjectTree.ts:
   - Export hook that wraps the store
   - Selector for commonly used data

3. src/features/object-tree/hooks/useObjectSelection.ts:
   - selectedObjects: MusicalObject[]
   - selectObject, clearSelection helpers

Use Zustand with TypeScript. Keep store logic pure.
```

---

## Phase 5: Layout Shell

### Prompt 5A: Route Groups & Layouts

```
Phase 5: Create the app routing structure with fixed layout zones.

Context:
- Two route groups: (marketing) and (studio)
- Studio layout: Top bar + Transport bar + 2-column (Object panel + Track area)
- Marketing layout: Simple header + content + footer

Task:
Set up the route structure and layouts.

1. app/(marketing)/layout.tsx:
   - Simple layout with header (logo, nav) and footer
   - No complex UI, just structure
   - Use Tailwind for styling

2. app/(marketing)/page.tsx:
   - Landing page placeholder
   - Hero section with "Open Studio" CTA button
   - Link to /studio

3. app/(studio)/layout.tsx:
   - Fixed layout with 3 zones:
     - Top: AppBar placeholder (h-14, bg-black)
     - Below: TransportBar placeholder (h-12, bg-black)
     - Main: 2-column layout (resizable later, for now 20% / 80%)
       - Left: Object panel placeholder
       - Right: Track area placeholder
   - Use Tailwind, dark theme

4. app/(studio)/page.tsx:
   - Project list placeholder
   - "New Project" button
   - Later: this becomes the project home

5. app/layout.tsx (root):
   - Global providers (wrap children)
   - Font setup (Inter or Geist Sans)
   - Import globals.css

Test: Navigate between / and /studio to verify layouts.
```

---

## Phase 6: UI Design System

### Prompt 6A: Design Tokens & Base Components

```
Phase 6: Create a design system matching our app styling.

Context:
- Follow DESIGN_SYSTEM.md: pure black (bg-black) background, zinc borders, cyan accents
- Main background: bg-black (#000000). Elevated surfaces: bg-zinc-950. Borders: border-zinc-900 or border-zinc-800/50
- Accent: Tailwind cyan-500, cyan-400; primary CTA gradient: from-cyan-500 to-blue-600
- Modern, clean aesthetics

Task:
Create design system primitives (or use Tailwind directly per DESIGN_SYSTEM.md).

1. Optional src/lib/theme.ts:
   - Only if you need JS values; otherwise use Tailwind classes from DESIGN_SYSTEM.md
   - If created: COLORS.background = '#000000', accent = cyan-500 hex, etc.

2. src/components/ui/button.tsx:
   - Button component with variants:
     - primary (bg-gradient-to-r from-cyan-500 to-blue-600, text-white)
     - secondary (outlined, border-cyan-500/30, text-cyan-400)
     - ghost (no background, text-zinc-400 hover:text-white)
   - Sizes: sm, md, lg
   - Use Tailwind; match DESIGN_SYSTEM.md

3. src/components/ui/card.tsx:
   - Card: bg-zinc-950 or bg-black with border-zinc-900, rounded, padding
   - Optional hover effect (hover:bg-zinc-900/50)

4. src/components/ui/input.tsx:
   - Input: dark theme (bg-zinc-950, border-zinc-800), text-white
   - Focus: ring-cyan-500/50 or focus:border-cyan-500

5. src/components/ui/dropdown.tsx:
   - Dropdown menu component
   - Use Radix UI primitives if available, or build with Headless UI

6. src/lib/utils.ts:
   - cn() helper for className merging (clsx + tailwind-merge)

Use Tailwind CSS. Make components composable and accessible.
```

---

## Phase 7: App Bar Component

### Prompt 7A: Top Navigation Bar

```
Phase 7: Create the AppBar component for the studio.

Context:
- Design system in src/components/ui; styling in DESIGN_SYSTEM.md
- Layout in app/(studio)/layout.tsx
- Use bg-black for main backgrounds, border-zinc-900, cyan accents

Task:
Create the AppBar component with proper UI elements.

1. src/features/studio-shell/components/AppBar.tsx:
   - Layout:
     - Left: Hamburger menu button (☰)
     - Center-left: Logo/wordmark "Music Assistant"
     - Center: Project name (editable input)
     - Right: "Upgrade" button (gradient: from-cyan-500 to-blue-600, or outlined cyan)
     - Far right: User avatar (placeholder)
   - Props:
     - projectName: string
     - onProjectNameChange: (name: string) => void
     - onMenuClick: () => void
     - onUpgradeClick: () => void
   - Styling:
     - Fixed top bar (h-16), bg-black, border-b border-zinc-800/50
     - Flex layout with space-between
     - Responsive: hide project name on mobile

2. Integration:
   - Update app/(studio)/layout.tsx to use AppBar
   - Pass dummy props for now

Visual reference: Moises.ai top bar (clean, minimal, dark)
```

---

## Phase 8: Transport Bar Component

### Prompt 8A: Playback Controls

```
Phase 8: Create the TransportBar component.

Context:
- Below AppBar in studio layout
- Controls: Play, Skip, Loop, Time, Metronome, Key
- Design system available

Task:
Create transport bar with playback controls.

1. src/features/transport/components/TransportBar.tsx:
   - Container component (h-16, bg-black, border-t optional)
   - Layout:
     - Left: Transport controls (Play, Pause, Skip Forward, Loop)
     - Center: Time display (00:00.0)
     - Right: Metronome, Time Signature (4/4), Key (Am)
   - Props:
     - isPlaying: boolean
     - currentTime: number
     - duration: number
     - timeSignature: { num: number; denom: number }
     - key: string
     - metronomeEnabled: boolean
     - onPlay: () => void
     - onPause: () => void
     - onSkip: () => void
     - onLoop: () => void
     - onSeek: (time: number) => void
     - onMetronomeToggle: () => void

2. src/features/transport/components/TransportControls.tsx:
   - Individual control buttons
   - Icon buttons with hover states

3. src/features/transport/components/TimeDisplay.tsx:
   - Format time as MM:SS.ms
   - Clickable to seek (optional)

Use lucide-react for icons. Style with Tailwind.
```

---

## Phase 9: Object Panel (Tree View)

### Prompt 9A: VSCode-Style Tree

```
Phase 9: Create the ObjectPanel with a collapsible tree view.

Context:
- Left panel in studio layout (20% width)
- Display MusicalObjects from the object-tree store
- VSCode-style file explorer aesthetics

Task:
Create a tree view component for musical objects.

1. src/features/object-tree/components/ObjectPanel.tsx:
   - Container component
   - Top: "+ Add File" button
   - Tree view below (scrollable)
   - Use useObjectTree() hook to get objects

2. src/features/object-tree/components/ObjectTreeNode.tsx:
   - Recursive tree node component
   - Show: icon, name, expand arrow (if children)
   - Click to expand/collapse
   - Click to select (highlight)
   - Right-click opens context menu (placeholder)
   - Props:
     - object: MusicalObject
     - depth: number (for indentation)
     - isSelected: boolean
     - onSelect: () => void

3. src/features/object-tree/components/ObjectIcon.tsx:
   - Show icon based on ObjectType
   - Audio: 🎵, MIDI: 🎹, Stems: 🎛️

4. Integration:
   - Update app/(studio)/layout.tsx to render ObjectPanel in left column
   - Add a sample object to the store for testing

Styling:
- Dark theme
- Hover effect on nodes
- Indentation for hierarchy
- Selected state (cyan highlight)
```

---

## Phase 10: Track Area Structure

### Prompt 10A: Timeline & Track Canvas

```
Phase 10: Create the track area structure (no rendering yet).

Context:
- Right panel in studio layout (80% width)
- Shows timeline ruler and track list
- Support view mode switching (waveform/MIDI/sheet)

Task:
Create the track area shell.

1. src/features/tracks/components/TrackArea.tsx:
   - Container component
   - Top: ViewModeSwitcher tabs (Waveform, MIDI, Sheet)
   - Below: TimelineRuler (fixed at top)
   - Main: TrackList (scrollable)
   - Props:
     - viewMode: ViewMode
     - onViewModeChange: (mode: ViewMode) => void

2. src/features/tracks/components/TimelineRuler.tsx:
   - Horizontal ruler with time markers (0s, 1s, 2s, ...)
   - Zoom controls (+ / -)
   - Playhead position indicator (vertical line)
   - Props:
     - duration: number
     - zoom: number
     - currentTime: number

3. src/features/tracks/components/TrackList.tsx:
   - List of TrackController components
   - For now, render empty placeholders
   - Props:
     - tracks: Array of objects to display

4. src/features/tracks/components/ViewModeSwitcher.tsx:
   - Tabs: Waveform | MIDI | Sheet
   - Active tab highlighted (cyan)

Integration:
- Add to app/(studio)/layout.tsx right panel
- Test view mode switching
```

---

## Phase 11: Track Controller (Shared Logic)

### Prompt 11A: Track Wrapper Component

```
Phase 11: Create the TrackController component.

Context:
- Every track (waveform/MIDI/sheet) uses this controller
- Provides: header, controls (M/S/H), volume, selection
- Children are the actual renderer (WaveformRenderer, etc.)

Task:
Create the universal track controller.

1. src/features/tracks/components/TrackController.tsx:
   - Layout:
     - Left: TrackHeader (fixed width, 150px)
     - Right: Renderer area (children)
   - Props:
     - object: MusicalObject
     - isMuted: boolean
     - isSolo: boolean
     - isHidden: boolean
     - isSelected: boolean
     - onToggleMute: () => void
     - onToggleSolo: () => void
     - onToggleHide: () => void
     - onSelect: () => void
     - children: ReactNode (the renderer)

2. src/features/tracks/components/TrackHeader.tsx:
   - Display:
     - Object icon and name
     - M (mute), S (solo), H (hide) toggle buttons
     - Volume slider (0-100)
   - Styling:
     - Dark background
     - Buttons highlight when active
     - Selected state (cyan border)

3. src/features/tracks/hooks/useTrackControls.ts:
   - Hook to manage track control state
   - State: muted, solo, hidden, volume
   - Return: state + toggle functions

Integration:
- Render one TrackController in TrackList as a demo
- Pass a placeholder child (e.g., <div>Renderer here</div>)
```

---

## Phase 12: Waveform Renderer

### Prompt 12A: Canvas-Based Audio Visualization

```
Phase 12: Create the WaveformRenderer component.

Context:
- Renders inside TrackController as children
- Use Canvas API for performance
- Display audio as cyan waveform on dark background

Task:
Create waveform visualization.

1. src/features/views/waveform/WaveformRenderer.tsx:
   - Component that renders to <canvas>
   - Props:
     - audioData: Float32Array (peaks)
     - duration: number
     - zoom: number
     - scrollX: number
   - Draw waveform with cyan stroke (Tailwind cyan-500 or cyan-400)
   - Dark background: bg-black (#000000)

2. src/features/views/waveform/hooks/useWaveformCanvas.ts:
   - Hook to manage canvas drawing
   - Handle resize
   - Redraw on data/zoom change

3. src/features/views/waveform/utils/waveform-utils.ts:
   - downsampleAudioData(data: Float32Array, targetLength: number): Float32Array
   - calculatePeaks(data: Float32Array): Float32Array

Integration:
- Use WaveformRenderer as child of TrackController
- Generate sample audio data for testing (sine wave or random)
- Verify it renders and responds to zoom

Use requestAnimationFrame for smooth rendering.
```

---

## Phase 13: MIDI Renderer (Piano Roll)

### Prompt 13A: Piano Roll View

```
Phase 13: Create the MidiRenderer component.

Context:
- Piano roll view (notes as rectangles, piano on left)
- Canvas-based for performance
- Use TrackController as wrapper

Task:
Create MIDI piano roll renderer.

1. src/features/views/midi/MidiRenderer.tsx:
   - Layout:
     - Left: PianoKeyboard component (fixed width, 60px)
     - Right: Canvas with notes
   - Props:
     - notes: Array<{ pitch: number; start: number; duration: number }>
     - duration: number
     - zoom: number
     - scrollX: number
     - scrollY: number
   - Draw notes as cyan rectangles
   - Horizontal = time, Vertical = pitch

2. src/features/views/midi/components/PianoKeyboard.tsx:
   - Vertical piano keyboard (88 keys)
   - White keys and black keys
   - Highlight on hover

3. src/features/views/midi/hooks/useMidiCanvas.ts:
   - Canvas rendering logic
   - Handle zoom and pan

4. src/features/views/midi/utils/midi-utils.ts:
   - pitchToY(pitch: number, height: number): number
   - notesToRects(notes: Note[], zoom: number): Rect[]

Integration:
- Generate sample MIDI notes for testing (C major scale)
- Render in TrackList as MidiRenderer

Reference: Moises.ai's piano roll (if visible in screenshots)
```

---

## Phase 14: Sheet Music Renderer

### Prompt 14A: Notation Rendering

```
Phase 14: Create the SheetMusicRenderer component.

Context:
- Render MIDI as sheet music notation
- Use VexFlow library for notation rendering
- Read-only for now (no editing)

Task:
Create sheet music renderer.

1. Install VexFlow:
   npm install vexflow

2. src/features/views/sheet/SheetMusicRenderer.tsx:
   - Component that uses VexFlow to render notation
   - Props:
     - notes: Array<{ pitch: number; duration: number }>
     - timeSignature: { num: number; denom: number }
     - keySignature: string
   - Render to SVG or Canvas
   - Show treble clef, time signature, notes

3. src/features/views/sheet/utils/midi-to-notation.ts:
   - Convert MIDI note numbers to VexFlow notation strings
   - midiToNoteName(pitch: number): string (e.g., 60 → "C4")
   - notesToVexFlowFormat(notes: Note[]): VexFlowNote[]

Integration:
- Use sample MIDI data
- Render in TrackList as SheetMusicRenderer

VexFlow documentation: https://github.com/0xfe/vexflow
```

---

## Phase 15: Tool Registry

### Prompt 15A: Plugin System for Tools

```
Phase 15: Create the tool registry system.

Context:
- Tools are modular plugins
- Each tool has metadata (name, icon, input/output types)
- Tools execute asynchronously and return new objects

Task:
Create a registry and sample tools.

1. src/features/tools/registry/tool-registry.ts:
   - ToolRegistry class
   - Methods:
     - register(tool: Tool): void
     - getTool(id: string): Tool | null
     - getToolsForObjectType(type: ObjectType): Tool[]
     - getAllTools(): Tool[]
   - Export singleton instance

2. src/features/tools/definitions/separate-stems-tool.ts:
   - Tool definition for stem separation
   - Metadata:
     - id: 'separate-stems'
     - name: 'Separate Stems'
     - icon: '🎛️'
     - inputTypes: [ObjectType.Audio]
     - outputType: ObjectType.Stems
   - execute function:
     - Call api-client to start job
     - Return promise that resolves when complete

3. src/features/tools/definitions/convert-to-midi-tool.ts:
   - Tool definition for audio → MIDI conversion
   - Similar structure to above

4. Initialize registry:
   - Register both tools on app load

Integration:
- Import registry in app/layout.tsx and initialize
- Test: toolRegistry.getToolsForObjectType(ObjectType.Audio)

Reference: Tool interface from src/types/tool.ts
```

---

## Phase 16: Tool Context Menu

### Prompt 16A: Right-Click Tool Menu

```
Phase 16: Create the contextual tool menu.

Context:
- Right-click on object in ObjectPanel
- Show applicable tools for that object type
- Execute tool on selection

Task:
Create context menu for tools.

1. src/features/tools/components/ContextMenu.tsx:
   - Component that renders a context menu
   - Props:
     - x: number
     - y: number
     - object: MusicalObject
     - tools: Tool[]
     - onToolSelect: (tool: Tool) => void
     - onClose: () => void
   - Styling:
     - Absolute positioned
     - Dark background, rounded
     - Hover effect on items

2. src/features/tools/components/ToolMenuItem.tsx:
   - Individual menu item
   - Show: icon, name, description (on hover)

3. src/features/tools/hooks/useContextMenu.ts:
   - Hook to manage menu state
   - State: isOpen, position, targetObject
   - open(x, y, object), close()

4. Integration:
   - Add onContextMenu handler to ObjectTreeNode
   - Get applicable tools from registry
   - Open ContextMenu on right-click
   - Close on outside click

Test: Right-click on audio object → see "Separate Stems" option
```

---

## Phase 17: Tool Execution & Job Tracking

### Prompt 17A: Execute Tools and Track Progress

```
Phase 17: Implement tool execution with job tracking.

Context:
- User selects tool from context menu
- Backend creates job, frontend polls for status
- Show progress UI (toast notification)
- Add new object to tree on completion

Task:
Create job tracking system.

1. src/features/tools/hooks/useToolExecution.ts:
   - Hook to execute tools
   - executeTool(tool: Tool, object: MusicalObject): Promise<MusicalObject>
   - Logic:
     a. Call tool.execute(object)
     b. Get jobId from response
     c. Start polling job status
     d. Show progress toast
     e. On completion: add result object to tree
     f. On error: show error toast

2. src/features/tools/services/job-poller.ts:
   - pollJob(jobId: string, onProgress?: (job: JobDTO) => void): Promise<JobDTO>
   - Poll every 2 seconds until status is 'completed' or 'failed'
   - Use api-client/endpoints/jobs.ts

3. src/features/tools/components/JobProgressToast.tsx:
   - Toast notification showing job progress
   - Display: tool name, progress bar, status
   - Dismiss on completion or error
   - Use a toast library (sonner or react-hot-toast)

4. Integration:
   - Update ContextMenu to call useToolExecution on tool select
   - Update object-tree store when tool completes

Test:
- Right-click audio object → Separate Stems
- See toast with progress
- New stem objects appear in tree
```

---

## Phase 18: Audio Playback Engine

### Prompt 18A: Web Audio API Playback

```
Phase 18: Create audio playback system.

Context:
- Use Web Audio API
- Support multi-track playback
- Respect mute/solo/volume controls
- Sync with transport bar

Task:
Create playback engine.

1. src/features/playback/audio-engine.ts:
   - AudioEngine class
   - Methods:
     - loadTrack(id: string, buffer: AudioBuffer): void
     - play(): void
     - pause(): void
     - stop(): void
     - seek(time: number): void
     - setTrackVolume(id: string, volume: number): void
     - setTrackMute(id: string, muted: boolean): void
     - getCurrentTime(): number
   - Use AudioContext, AudioBufferSourceNode

2. src/features/playback/hooks/useAudioPlayback.ts:
   - Hook that wraps AudioEngine
   - State: isPlaying, currentTime
   - Actions: play, pause, seek
   - Connect to transport bar state

3. src/features/playback/track-mixer.ts:
   - Handle solo/mute logic across multiple tracks
   - Solo = mute all others

4. Integration:
   - Connect TransportBar buttons to useAudioPlayback
   - Load sample audio for testing
   - Playhead moves during playback

Test:
- Click play → audio plays
- Mute track → audio stops
- Seek → playback jumps to position

Reference: Web Audio API documentation
```

---

## Phase 19: Project Management (Home Page)

### Prompt 19A: Project List Page

```
Phase 19: Create the project home page.

Context:
- Main page in (studio) route group
- Shows recent projects
- Create new project button
- Navigate to project workspace

Task:
Create project management UI.

1. app/(studio)/page.tsx:
   - Page showing project list
   - Top: "New Project" button
   - Grid of ProjectCard components
   - Fetch projects from backend (or mock for now)

2. src/features/projects/components/ProjectCard.tsx:
   - Card showing:
     - Thumbnail (placeholder image)
     - Project name
     - Last modified date
     - Click to open project
   - Hover effect

3. src/features/projects/components/NewProjectDialog.tsx:
   - Modal dialog for creating new project
   - Fields: Project name, Template (optional)
   - Submit → create project → navigate to /studio/project/[id]

4. src/features/projects/hooks/useProjects.ts:
   - Hook to fetch and manage projects
   - State: projects[], isLoading
   - Actions: createProject, deleteProject

5. Integration:
   - Use Card component from design system
   - Mock project data for now
   - Navigation to project workspace page

Test: Click "New Project" → enter name → navigate to workspace
```

---

## Phase 20: File Upload & Object Import

### Prompt 20A: Drag & Drop File Upload

```
Phase 20: Add file upload to object panel.

Context:
- Drag audio/MIDI files into object panel
- Upload to backend
- Create MusicalObject in tree
- Show progress

Task:
Create file upload system.

1. src/features/object-tree/components/FileUpload.tsx:
   - Drag & drop zone in ObjectPanel
   - Also: "+ Add File" button opens file picker
   - Accept: .wav, .mp3, .mid
   - onDrop → start upload

2. src/features/object-tree/hooks/useFileUpload.ts:
   - uploadFile(file: File, projectId: string): Promise<MusicalObject>
   - Logic:
     a. Call api-client/endpoints/audio.uploadAudio()
     b. Show UploadProgress component
     c. On success: add object to tree
     d. On error: show error toast

3. src/features/object-tree/components/UploadProgress.tsx:
   - Progress bar showing upload % 
   - Cancel button (optional)

4. Integration:
   - Update ObjectPanel to include FileUpload
   - Connect to object-tree store

Test:
- Drag .wav file into panel
- See progress bar
- File appears in object tree
```

---

## Phase 21: Keyboard Shortcuts & Command Palette

### Prompt 21A: Shortcuts & Command Palette

```
Phase 21: Add keyboard shortcuts and command palette.

Context:
- Shortcuts: Space = play/pause, etc.
- Command palette: Cmd+K to open, search tools
- Use cmdk library for palette

Task:
Add keyboard shortcuts and command palette.

1. Install cmdk:
   npm install cmdk

2. src/features/shortcuts/keyboard-handler.ts:
   - Register global keyboard listeners
   - Shortcuts:
     - Space: play/pause
     - Cmd+K: open command palette
     - Delete: delete selected object
   - Use window.addEventListener('keydown')

3. src/features/shortcuts/components/CommandPalette.tsx:
   - cmdk-based command palette
   - Search tools, projects, actions
   - Execute on selection
   - Styling: dark theme, cyan highlight

4. src/features/shortcuts/commands.ts:
   - Define commands:
     - Tools (separate stems, to MIDI, etc.)
     - Actions (new project, upload file, etc.)
   - Each command has: id, name, icon, execute()

5. Integration:
   - Render CommandPalette in app/layout.tsx
   - Initialize keyboard handler on mount

Test: Press Cmd+K → type "separate" → see tool → execute
```

---

## Phase 22: Marketing Pages

### Prompt 22A: Landing Page

```
Phase 22: Create the marketing landing page.

Context:
- Inspired by Moises.ai landing page
- Dark theme, modern aesthetics
- Hero + features + CTA

Task:
Create landing page in (marketing) route.

1. app/(marketing)/page.tsx:
   - Page structure:
     - Hero section
     - Feature section
     - Demo video (optional)
     - CTA section
     - Footer

2. src/features/marketing/components/Hero.tsx:
   - Large heading: "The Creative Suite for the Modern Musician"
   - Subheading: brief description
   - CTA button: "Open Studio" → /studio
   - Background: gradient or image

3. src/features/marketing/components/FeatureSection.tsx:
   - 3 feature cards:
     - Stem Separation
     - MIDI Conversion
     - Multi-View Workspace
   - Each card: icon, title, description

4. src/features/marketing/components/Footer.tsx:
   - Links: About, Pricing, Contact
   - Copyright notice

Styling:
- Pure black background (bg-black), zinc borders; see DESIGN_SYSTEM.md
- Cyan accents for buttons (from-cyan-500 to-blue-600 or text-cyan-400)
- Responsive (mobile-first)
```

---

## Phase 23: Responsive Design

### Prompt 23A: Tablet & Mobile Support

```
Phase 23: Make the UI responsive.

Context:
- Currently desktop-only
- Target: iPad (1024px) and mobile (768px)
- Adjust layouts, collapse panels

Task:
Add responsive breakpoints.

1. Update app/(studio)/layout.tsx:
   - On mobile: hide ObjectPanel by default
   - Add hamburger menu to toggle panel (drawer)
   - Stack transport controls vertically on small screens

2. Update ObjectPanel:
   - Full-screen drawer on mobile
   - Slide in from left

3. Update TrackArea:
   - Horizontal scroll on mobile
   - Reduce track header width

4. Update AppBar:
   - Hide project name on mobile
   - Show only logo and menu button

Use Tailwind responsive utilities (md:, lg:).

Test on Chrome DevTools device emulation.
```

---

## Phase 24: Testing & Polish

### Prompt 24A: Add Tests and Error Handling

```
Phase 24: Add tests and polish the UX.

Context:
- Use Vitest + React Testing Library
- Focus on critical paths
- Add error boundaries

Task:
Add tests and improve error handling.

1. tests/unit/object-tree.test.ts:
   - Test object-tree store:
     - addObject
     - removeObject
     - selectObject

2. tests/unit/tool-execution.test.ts:
   - Test tool execution flow (mock API)

3. tests/integration/project-workflow.test.ts:
   - Test: create project → upload file → apply tool

4. Add error boundaries:
   - app/error.tsx (already exists)
   - src/components/ErrorBoundary.tsx (custom)

5. Add loading states:
   - Skeleton loaders for project list
   - Spinner for file uploads
   - Loading overlay for long operations

6. Polish:
   - Smooth animations (Framer Motion or Tailwind transitions)
   - Toast notifications for all actions
   - Tooltips on buttons

Run tests with: npm test
```

---

## General Cursor Tips

### Tip 1: Referencing Files
```
"Use the Button component from src/components/ui/button.tsx
and follow DESIGN_SYSTEM.md for colors (bg-black, cyan accents, zinc borders)."
```

### Tip 2: Iterating on Errors
```
"The component isn't rendering. Check that:
1. Imports are correct
2. Props are passed
3. No TypeScript errors
Fix any issues."
```

### Tip 3: Testing Verification
```
"After creating this, show me:
1. How to verify it works in the browser
2. What the expected output should look like
3. Any console logs to check"
```

### Tip 4: Incremental Updates
```
"Now add a hover effect to the buttons.
Use Tailwind hover: pseudo-class.
Keep the existing functionality."
```

---

## Next Steps After All Phases

1. Deploy to Vercel or Netlify
2. Connect to production backend
3. Add user authentication (Auth0, Clerk)
4. Add more tools (time-stretch, pitch-shift, etc.)
5. Add collaboration features (sharing projects)
6. Mobile app (React Native or Tauri)

---

**Remember:** Complete one phase before moving to the next. Test in the browser after each phase. Keep Cursor prompts focused and specific.

Good luck building! 🚀
