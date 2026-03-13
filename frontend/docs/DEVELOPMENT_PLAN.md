# AI Music Agent - Frontend Development Plan

## Current Progress (as of Jan 2026)

| Phase | Status | Notes |
|-------|--------|-------|
| 0 Foundation | ✅ Done | App Router, route groups, TypeScript, Tailwind |
| 1 Type System | ✅ Done | MusicalObject, Project, Tool, View in `src/types/` |
| 2 API Client | ✅ Done | `src/api-client/` – audio, jobs, chat |
| 3 Adapters | ✅ Done | `src/adapters/` – job → object, project, status |
| 4 Object Tree | ✅ Done | Zustand store + hooks in `src/features/object-tree/` |
| 5 Layout Shell | 🟡 Partial | Studio sidebar + project DAW shell exist; object panel not wired to store |
| 6–8 Design / AppBar / Transport | 🟡 Partial | Present in layouts (header, transport footer); no shared design system yet |
| 9+ Object Panel (tree), Track Area, Waveform, Tools, Playback | 🔲 Not done | Shells/placeholders only |

**Next:** Wire object panel to object-tree store, then upload flow, then track area + waveform, then tool execution and playback. See [PROJECT_STATUS.md](../PROJECT_STATUS.md) for full stack status.

---

## Project Overview

A Next.js-based music workstation that is **NOT a DAW** but a **project-centric workspace** where:
- **MusicalObjects** exist (audio, MIDI, derived items)
- **Tools** operate on objects and produce new objects
- **Views** (waveform/MIDI/sheet) render objects without owning data
- **Object tree** is the single source of truth; tracks are projections

---

## 🚀 MVP vs Full Feature Set

This plan includes both **MVP features** (build first) and **future features** (add later when backend is ready).

### MVP Focus (Build First - ~20-25 hours)
- ✅ Waveform view only
- ✅ Stem separation tool only
- ✅ Core architecture and UI
- ✅ Audio playback for waveforms

### Future Features (Add Later)
- 🔲 MIDI view (piano roll) - Phase 13
- 🔲 Sheet music view - Phase 14
- 🔲 Audio-to-MIDI conversion tool
- 🔲 Analysis tools (key detection, chords)

**Current backend status:**
- ✅ Stem separation (Demucs) - working
- 🔲 Audio-to-MIDI - in progress
- 🔲 Sheet music rendering - not implemented

---

## Core Mental Model

### The 4 Primitives (Non-Negotiable)

1. **Project**
   - Owns everything: tempo, key, metadata
   - Contains the object tree
   - Project-centric (not file-centric)

2. **MusicalObject**
   - Audio files (song.wav, bass.wav)
   - MIDI files (bass.mid)
   - Derived objects (stems, analysis data)
   - Hierarchical relationships (parent/child)

3. **Tool**
   - Stem separation
   - Audio → MIDI conversion
   - Analysis (key detection, chord extraction)
   - **Tools transform objects into new child objects**

4. **View**
   - Waveform renderer
   - Piano roll (MIDI) renderer
   - Sheet music renderer
   - **Views do NOT own data; they only render**

### Critical Architecture Rules

- **Object tree** = source of truth
- **Tracks** = projections/views of selected objects
- **Tools** = contextual actions (right-click) + global palette
- **Views** = shared controller, different renderers
- Backend communication = typed API client + adapters only

---

## Layout Zones (Fixed Structure)

```
┌──────────────────────────────────────────────────────┐
│ App Bar                                              │
│ (logo, menu, project name, user)                     │
├──────────────────────────────────────────────────────┤
│ Transport Bar                                        │
│ (▶️ ⏭️ 🔁 | 00:00.0 | 🎼 | 4/4 | Am)                 │
├──────────────────┬───────────────────────────────────┤
│ Object Panel     │ Track / View Area                 │
│                  │                                   │
│ + Add file       │ ╔══════════════════════════════╗ │
│ > song.wav    ●  │ ║ Waveform / MIDI / Sheet      ║ │
│   > vocals.wav   │ ║                              ║ │
│   > bass.wav     │ ║ Track 1: song.wav  [M][S][H] ║ │
│     > bass.mid   │ ║ ▓▓▓░░▓▓░░▓▓░░▓▓░░▓▓         ║ │
│   > drums.wav    │ ║                              ║ │
│   > other.wav    │ ║ Track 2: bass.wav  [M][S][H] ║ │
│                  │ ║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓         ║ │
│ [View Switcher]  │ ║                              ║ │
│ 🌊 Waveform      │ ╚══════════════════════════════╝ │
│ 🎹 MIDI          │                                   │
│ 🎼 Sheet Music   │                                   │
└──────────────────┴───────────────────────────────────┘
```

---

## Development Strategy: Cursor-Friendly Approach

### Rule #1: Never Say "Build the Frontend"

Give Cursor **small, architectural instructions** that build on each other.

### Phase-Based Development

Each phase is a **single Cursor conversation** with clear acceptance criteria.

---

## Development Phases

### Phase 0: Foundation Setup ✅ (Completed)
- Next.js App Router structure
- TypeScript + Tailwind configuration
- Basic routing with route groups

### Phase 1: Type System & Domain Models
**Goal:** Establish the core data structures

**Cursor Prompt Strategy:**
```
"Create TypeScript types for the 4 core primitives:
Project, MusicalObject, Tool, and View.
Include proper inheritance and relationships."
```

**Deliverables:**
- `src/types/musical-object.ts`
- `src/types/project.ts`
- `src/types/tool.ts`
- `src/types/view.ts`

**Acceptance Criteria:**
- All types are properly exported
- Relationships are type-safe
- Enums for ObjectType, ToolType, ViewMode

### Phase 2: API Client Layer
**Goal:** Backend integration behind typed interface

**Cursor Prompt Strategy:**
```
"Create a typed API client for the FastAPI backend.
Include endpoints for jobs, audio, and chat.
Use fetch with proper error handling."
```

**Deliverables:**
- `src/api-client/client.ts` (base HTTP client)
- `src/api-client/endpoints/jobs.ts`
- `src/api-client/endpoints/audio.ts`
- `src/api-client/endpoints/chat.ts`
- `src/api-client/types.ts` (API DTOs)

**Acceptance Criteria:**
- Type-safe request/response
- Error handling
- Base URL configuration
- Auth header support (for future)

### Phase 3: Adapters (API ↔ App Models)
**Goal:** Decouple API shape from app domain

**Cursor Prompt Strategy:**
```
"Create adapter functions that convert API DTOs
to app domain models and vice versa.
Focus on MusicalObject and Job transformations."
```

**Deliverables:**
- `src/adapters/musical-object.ts`
- `src/adapters/job.ts`
- `src/adapters/project.ts`

**Acceptance Criteria:**
- Clean conversion logic
- Null/undefined handling
- Type safety preserved

### Phase 4: Object Tree State Management
**Goal:** Single source of truth for the object hierarchy

**Cursor Prompt Strategy:**
```
"Create a Zustand store (or React Context) for the object tree.
Support: add, remove, update, and query operations.
Include selection state management."
```

**Deliverables:**
- `src/features/object-tree/store/object-tree-store.ts`
- `src/features/object-tree/hooks/useObjectTree.ts`
- `src/features/object-tree/hooks/useObjectSelection.ts`

**Acceptance Criteria:**
- Immutable updates
- Parent-child relationships maintained
- Selection (single + multi)
- Undo/redo support (basic)

### Phase 5: Layout Shell (Marketing + Studio)
**Goal:** Fixed layout structure with route groups

**Cursor Prompt Strategy:**
```
"Create the app routing structure with two route groups:
(marketing) for landing pages and (studio) for the workspace.
The studio layout should have the 3 fixed zones."
```

**Deliverables:**
- `app/(marketing)/layout.tsx`
- `app/(marketing)/page.tsx`
- `app/(studio)/layout.tsx`
- `app/(studio)/page.tsx` (or `/project/[id]/page.tsx`)

**Acceptance Criteria:**
- Route groups working
- Layout zones render correctly
- Responsive behavior (basic)

### Phase 6: UI Design System
**Goal:** Reusable components with consistent styling

**Cursor Prompt Strategy:**
```
"Create a design system matching DESIGN_SYSTEM.md:
pure black (bg-black) background, zinc borders, cyan accents (Tailwind cyan-500/400), modern buttons,
cards, inputs. Use Tailwind and create base components."
```

**Deliverables:**
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/dropdown.tsx`
- Optional `src/lib/theme.ts`; prefer Tailwind classes from DESIGN_SYSTEM.md

**Acceptance Criteria:**
- Pure black background (bg-black); see DESIGN_SYSTEM.md
- Cyan accent (Tailwind cyan-500/cyan-400)
- Consistent spacing
- Accessible (basic ARIA)

### Phase 7: App Bar Component
**Goal:** Top navigation with logo, menu, project name

**Cursor Prompt Strategy:**
```
"Create the AppBar component with:
- Hamburger menu (left)
- Logo (center-left)
- Project name (center)
- 'Get Pro' button (right)
- User avatar (far right)
Use the design system components."
```

**Deliverables:**
- `src/features/studio-shell/components/AppBar.tsx`
- `src/features/studio-shell/components/UserMenu.tsx`

**Acceptance Criteria:**
- Fixed positioning
- Responsive layout
- Menu opens/closes

### Phase 8: Transport Bar Component
**Goal:** Playback controls and project metadata

**Cursor Prompt Strategy:**
```
"Create the TransportBar component with:
- Play/Pause, Skip, Loop buttons
- Time display (00:00.0)
- Metronome toggle
- Time signature display (4/4)
- Key signature display (Am)
Make it stateless (controlled component)."
```

**Deliverables:**
- `src/features/transport/components/TransportBar.tsx`
- `src/features/transport/components/TransportControls.tsx`
- `src/features/transport/components/TimeDisplay.tsx`

**Acceptance Criteria:**
- All controls visible
- Click handlers (props)
- Disabled states

### Phase 9: Object Panel (Tree View)
**Goal:** VSCode-like file explorer for musical objects

**Cursor Prompt Strategy:**
```
"Create an ObjectPanel component that displays
the object tree in a VSCode-style collapsible view.
Include: expand/collapse, icons per type,
selection (single/multi), drag to reorder."
```

**Deliverables:**
- `src/features/object-tree/components/ObjectPanel.tsx`
- `src/features/object-tree/components/ObjectTreeNode.tsx`
- `src/features/object-tree/components/ObjectIcon.tsx`

**Acceptance Criteria:**
- Hierarchical rendering
- Expand/collapse animation
- Selection visual feedback
- Right-click context menu (placeholder)

### Phase 10: Track Area Structure
**Goal:** Canvas for viewing objects as tracks

**Cursor Prompt Strategy:**
```
"Create the TrackArea component with:
- Horizontal timeline ruler
- Scrollable track list
- Zoom controls
- View mode switcher (waveform/MIDI/sheet)
Start with a basic layout; no rendering yet."
```

**Deliverables:**
- `src/features/tracks/components/TrackArea.tsx`
- `src/features/tracks/components/TimelineRuler.tsx`
- `src/features/tracks/components/TrackList.tsx`
- `src/features/tracks/components/ViewModeSwitcher.tsx`

**Acceptance Criteria:**
- Timeline shows time markers
- Tracks render as empty rows
- View mode tabs functional

### Phase 11: Track Controller (Shared Logic)
**Goal:** Universal track behavior (mute, solo, hide)

**Cursor Prompt Strategy:**
```
"Create a TrackController component that wraps
any track renderer. It should handle:
- Track header (name, M/S/H buttons)
- Volume slider
- Selection state
- Focus/expand behavior
Pass children as the renderer."
```

**Deliverables:**
- `src/features/tracks/components/TrackController.tsx`
- `src/features/tracks/components/TrackHeader.tsx`
- `src/features/tracks/hooks/useTrackControls.ts`

**Acceptance Criteria:**
- Mute/Solo/Hide toggle
- Visual states (selected, focused)
- Renders children correctly

### Phase 12: Waveform Renderer ✅ MVP
**Goal:** Render audio objects as waveforms

**Cursor Prompt Strategy:**
```
"Create a WaveformRenderer component using Canvas API.
Accept audio data as a prop (float array).
Render as waveform on dark background.
Support zoom and pan."
```

**Deliverables:**
- `src/features/views/waveform/WaveformRenderer.tsx`
- `src/features/views/waveform/hooks/useWaveformCanvas.ts`
- `src/features/views/waveform/utils/waveform-utils.ts`

**Acceptance Criteria:**
- Waveform renders correctly
- Smooth zoom/pan
- Performance for large files

**MVP Note:** This is the ONLY view needed for MVP. Skip phases 13-14 for now.

### Phase 13: MIDI Renderer (Piano Roll) 🔲 FUTURE
**Goal:** Render MIDI objects as piano roll

**Status:** ⏸️ **SKIP FOR MVP** - Add later when backend MIDI support is ready

**Cursor Prompt Strategy:**
```
"Create a MidiRenderer component (piano roll view).
Show notes as rectangles on a vertical piano keyboard.
Use Canvas API for performance."
```

**Deliverables:**
- `src/features/views/midi/MidiRenderer.tsx`
- `src/features/views/midi/components/PianoKeyboard.tsx`
- `src/features/views/midi/hooks/useMidiCanvas.ts`

**Acceptance Criteria:**
- Piano keys on left
- Notes render as bars
- Zoom/pan support

**When to implement:** After backend audio-to-MIDI conversion is stable.

### Phase 14: Sheet Music Renderer 🔲 FUTURE
**Goal:** Render MIDI as sheet music notation

**Status:** ⏸️ **SKIP FOR MVP** - Add later when MIDI view exists

**Cursor Prompt Strategy:**
```
"Create a SheetMusicRenderer component using
a library like VexFlow or abcjs.
Convert MIDI data to notation and render."
```

**Deliverables:**
- `src/features/views/sheet/SheetMusicRenderer.tsx`
- `src/features/views/sheet/utils/midi-to-notation.ts`

**Acceptance Criteria:**
- Staff notation renders
- Clefs, time signature, key signature
- Basic note rendering

**When to implement:** After Phase 13 (MIDI Renderer) is complete.

### Phase 15: Tool Registry ✅ MVP
**Goal:** Plugin-like system for tools

**Cursor Prompt Strategy:**
```
"Create a tool registry system where each tool
is a self-contained module with metadata.
Include: tool ID, name, icon, description,
input types, output types, execute function."
```

**Deliverables:**
- `src/features/tools/registry/tool-registry.ts`
- `src/features/tools/types/tool-interface.ts`
- `src/features/tools/definitions/separate-stems-tool.ts`
- ~~`src/features/tools/definitions/convert-to-midi-tool.ts`~~ (Skip for MVP)

**Acceptance Criteria:**
- Registry is extensible
- Tools self-describe capabilities
- Type-safe tool execution

**MVP Note:** Only implement the stem separation tool. Add convert-to-midi later when backend is ready.

### Phase 16: Tool Context Menu ✅ MVP
**Goal:** Right-click to apply tools

**Cursor Prompt Strategy:**
```
"Create a ContextMenu component that appears
on right-click of an object in the tree.
Show available tools filtered by object type.
Trigger tool execution on selection."
```

**Deliverables:**
- `src/features/tools/components/ContextMenu.tsx`
- `src/features/tools/hooks/useContextMenu.ts`
- `src/features/tools/components/ToolMenuItem.tsx`

**Acceptance Criteria:**
- Menu appears at cursor
- Shows only applicable tools (for MVP: just "Separate Stems")
- Closes on outside click

**MVP Note:** Will only show one tool for now (Separate Stems). More tools can be added later.

### Phase 17: Tool Execution & Job Tracking ✅ MVP
**Goal:** Execute tools via backend and track progress

**Cursor Prompt Strategy:**
```
"Create a job tracking system that:
- Calls backend to execute tool (stem separation)
- Polls for job status
- Shows progress UI (toast/modal)
- Updates object tree on completion"
```

**Deliverables:**
- `src/features/tools/hooks/useToolExecution.ts`
- `src/features/tools/components/JobProgressToast.tsx`
- `src/features/tools/services/job-poller.ts`

**Acceptance Criteria:**
- Tool triggers backend job
- Progress shows in UI
- New stem objects added to tree

**MVP Note:** Only implement for stem separation. Other tools can reuse this infrastructure later.

### Phase 18: Audio Playback Engine
**Goal:** Play audio objects in the timeline

**Cursor Prompt Strategy:**
```
"Create an audio playback manager using Web Audio API.
Support: play, pause, stop, seek, loop.
Handle multiple tracks with solo/mute.
Sync with transport bar."
```

**Deliverables:**
- `src/features/playback/audio-engine.ts`
- `src/features/playback/hooks/useAudioPlayback.ts`
- `src/features/playback/track-mixer.ts`

**Acceptance Criteria:**
- Multi-track playback
- Transport controls work
- Mute/solo respected
- Cursor follows playback

### Phase 19: Project Management (Home Page)
**Goal:** Create, open, delete projects

**Cursor Prompt Strategy:**
```
"Create a home page in the (studio) route group that shows:
- Recent projects (grid/list)
- 'New Project' button
- Project metadata (name, date, thumbnail)
Connect to backend for project CRUD."
```

**Deliverables:**
- `app/(studio)/page.tsx` (project list)
- `src/features/projects/components/ProjectCard.tsx`
- `src/features/projects/components/NewProjectDialog.tsx`

**Acceptance Criteria:**
- Projects list renders
- Create new project works
- Navigation to project workspace

### Phase 20: File Upload & Object Import
**Goal:** Add audio/MIDI files to project

**Cursor Prompt Strategy:**
```
"Create file upload functionality:
- Drag & drop into object panel
- File picker dialog
- Upload to backend
- Create MusicalObject in tree
- Show upload progress"
```

**Deliverables:**
- `src/features/object-tree/components/FileUpload.tsx`
- `src/features/object-tree/hooks/useFileUpload.ts`
- `src/features/object-tree/components/UploadProgress.tsx`

**Acceptance Criteria:**
- Drag & drop works
- Upload to backend
- Object added to tree
- Progress indicator

### Phase 21: Keyboard Shortcuts & Command Palette
**Goal:** Pro-user efficiency features

**Cursor Prompt Strategy:**
```
"Add keyboard shortcuts (space = play/pause, etc.)
and a command palette (Cmd+K) for tool access.
Use a library like cmdk."
```

**Deliverables:**
- `src/features/shortcuts/keyboard-handler.ts`
- `src/features/shortcuts/components/CommandPalette.tsx`
- `src/features/shortcuts/commands.ts`

**Acceptance Criteria:**
- Common shortcuts work
- Command palette opens
- Tool execution via palette

### Phase 22: Marketing Pages
**Goal:** Landing page inspired by Moises.ai

**Cursor Prompt Strategy:**
```
"Create a marketing landing page in (marketing) route:
- Hero section with CTA
- Feature cards
- Demo video
- Pricing section
- Footer
Use the design system, keep it simple and modern."
```

**Deliverables:**
- `app/(marketing)/page.tsx`
- `src/features/marketing/components/Hero.tsx`
- `src/features/marketing/components/FeatureSection.tsx`

**Acceptance Criteria:**
- Responsive design
- CTA navigates to studio
- Modern aesthetics

### Phase 23: Responsive Design & Mobile
**Goal:** Make it work on tablets (stretch: mobile)

**Cursor Prompt Strategy:**
```
"Add responsive breakpoints for tablet.
Collapse object panel into drawer.
Stack transport controls vertically on small screens."
```

**Deliverables:**
- Updated layouts with Tailwind breakpoints
- Mobile navigation drawer
- Touch-friendly controls

**Acceptance Criteria:**
- Works on iPad (1024px)
- No horizontal scroll
- Core features accessible

### Phase 24: Testing & Polish
**Goal:** Ensure stability and smooth UX

**Cursor Prompt Strategy:**
```
"Add basic tests for:
- Object tree operations
- Tool execution flow
- API client error handling
Use Vitest + React Testing Library."
```

**Deliverables:**
- Test files for critical paths
- Error boundary components
- Loading states everywhere

**Acceptance Criteria:**
- No console errors
- Graceful error handling
- Smooth animations

---

## Working with Cursor: Best Practices

### 1. One Phase = One Conversation
Don't try to build multiple phases in one go. Complete Phase 7 before moving to Phase 8.

### 2. Always Provide Context
When starting a phase, tell Cursor:
```
"We're building Phase 7: App Bar Component.
We already have:
- Design system in src/components/ui
- Layout shell in app/(studio)/layout.tsx

Now create the AppBar component with..."
```

### 3. Reference Existing Code
```
"Use the Button component from src/components/ui/button.tsx
and follow DESIGN_SYSTEM.md for colors (bg-black, cyan accents)"
```

### 4. Request Specific File Locations
```
"Create src/features/transport/components/TransportBar.tsx"
```

### 5. Ask for Acceptance Verification
```
"After creating the component, show me how to verify
that all controls are working in the browser."
```

### 6. Iterate in Small Steps
If something doesn't work:
```
"The TransportBar isn't rendering. Check that:
1. It's imported in the layout
2. Props are passed correctly
3. No TypeScript errors"
```

### 7. Keep State Close to Usage
Don't create global state too early. Start with local state, then lift when needed.

### 8. Test Incrementally
After each phase, manually test in the browser before moving on.

---

## Example Cursor Prompt (Phase 7)

```
I'm building Phase 7 of the AI Music Agent frontend.

Context:
- We have a design system in src/components/ui with Button, Card, Input
- The studio layout is in app/(studio)/layout.tsx
- We're using Tailwind per DESIGN_SYSTEM.md: pure black (bg-black), zinc borders, cyan accents

Task:
Create the AppBar component for the top navigation bar.

Requirements:
- Hamburger menu button (left) - onClick handler as prop
- Logo/wordmark "AI Music Agent" (center-left) - clickable, navigates home
- Project name input (center) - editable, controlled component
- "Get Pro" button (right) - outlined cyan style
- User avatar placeholder (far right) - show initials "SG"

Location: src/features/studio-shell/components/AppBar.tsx

The component should:
1. Be a fixed top bar (h-14)
2. Use flex layout with space-between
3. Accept props: projectName, onProjectNameChange, onMenuClick, onGetPro
4. Be responsive (hide project name on mobile)

Please create the component and show me how to integrate it into the studio layout.
```

---

## Tech Stack Summary

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State:** Zustand (or React Context for simpler cases)
- **API Calls:** fetch (with custom client wrapper)
- **Audio:** Web Audio API
- **Canvas Rendering:** Canvas API (for waveforms/MIDI)
- **Sheet Music:** VexFlow or abcjs
- **Command Palette:** cmdk
- **Icons:** Lucide React
- **Testing:** Vitest + React Testing Library (Phase 24)

---

## File Structure Reference

See `FOLDER_STRUCTURE.md` for the complete directory layout.

---

## Design Reference

- **Primary inspiration:** Moises.ai (dark theme, clean UI, tool-based workflow)
- **Color scheme:** See **DESIGN_SYSTEM.md** – pure black (`bg-black`), zinc for borders/surfaces, cyan accents (Tailwind cyan-500/400)
  - Text: `#FFFFFF` / `#A0A0A0`
- **Typography:** Inter or Geist Sans
- **Spacing:** 4px grid (Tailwind default)

---

## Success Metrics

By the end of all phases, you should have:

✅ A working project-based music workspace
✅ Object tree with parent-child relationships
✅ Multiple view modes (waveform, MIDI, sheet)
✅ Tool execution with job tracking
✅ Audio playback with multi-track support
✅ Professional, modern UI per DESIGN_SYSTEM.md (black, zinc, cyan)
✅ Extensible architecture for new tools/features

---

## Next Steps

1. Review this document
2. Start with Phase 1 (Type System)
3. Use the example prompt format
4. Complete one phase before moving to the next
5. Test incrementally in the browser

Good luck! 🚀
