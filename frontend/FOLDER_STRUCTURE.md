# AI Music Agent - Folder Structure

This document outlines the complete folder structure for the Next.js frontend, adhering to professional standards and the architectural constraints defined in the development plan.

---

## Complete Directory Tree

```
frontend/
│
├── app/                                    # Next.js App Router - ROUTES ONLY
│   ├── (marketing)/                        # Route group: Landing & marketing pages
│   │   ├── layout.tsx                      # Marketing layout (simple header/footer)
│   │   ├── page.tsx                        # Landing page (/)
│   │   ├── pricing/
│   │   │   └── page.tsx                    # Pricing page
│   │   └── about/
│   │       └── page.tsx                    # About page
│   │
│   ├── (studio)/                           # Route group: Project workspace
│   │   ├── layout.tsx                      # Studio layout (AppBar + Transport + 2-column)
│   │   ├── page.tsx                        # Project list / home
│   │   └── project/
│   │       └── [id]/
│   │           └── page.tsx                # Project workspace (/studio/project/[id])
│   │
│   ├── api/                                # API routes (if needed for NextJS middleware)
│   │   └── health/
│   │       └── route.ts                    # Health check endpoint
│   │
│   ├── layout.tsx                          # Root layout (global providers, fonts)
│   ├── globals.css                         # Global styles (Tailwind directives)
│   ├── favicon.ico
│   └── error.tsx                           # Global error boundary
│
├── src/                                    # All non-route code
│   │
│   ├── api-client/                         # Typed FastAPI integration
│   │   ├── client.ts                       # Base HTTP client (fetch wrapper)
│   │   ├── config.ts                       # API base URL, timeouts
│   │   ├── types.ts                        # API request/response DTOs
│   │   └── endpoints/                      # Per-resource API calls
│   │       ├── jobs.ts                     # Job-related endpoints
│   │       ├── audio.ts                    # Audio upload/download
│   │       ├── chat.ts                     # Chat/agent endpoints
│   │       └── projects.ts                 # Project CRUD
│   │
│   ├── adapters/                           # API ↔ App model transformations
│   │   ├── musical-object.ts               # API Job → MusicalObject
│   │   ├── job.ts                          # API Job → App Job
│   │   └── project.ts                      # API Project → App Project
│   │
│   ├── types/                              # Core domain types
│   │   ├── musical-object.ts               # MusicalObject, ObjectType enum
│   │   ├── project.ts                      # Project, ProjectMetadata
│   │   ├── tool.ts                         # Tool interface, ToolType enum
│   │   ├── view.ts                         # ViewMode enum, ViewConfig
│   │   └── index.ts                        # Re-exports
│   │
│   ├── features/                           # Domain-specific modules
│   │   │
│   │   ├── object-tree/                    # Object tree (source of truth)
│   │   │   ├── components/
│   │   │   │   ├── ObjectPanel.tsx         # Left panel container
│   │   │   │   ├── ObjectTreeNode.tsx      # Individual tree node (collapsible)
│   │   │   │   ├── ObjectIcon.tsx          # Icon based on object type
│   │   │   │   ├── FileUpload.tsx          # Drag & drop / file picker
│   │   │   │   └── UploadProgress.tsx      # Upload progress indicator
│   │   │   ├── hooks/
│   │   │   │   ├── useObjectTree.ts        # Access tree state
│   │   │   │   ├── useObjectSelection.ts   # Selection state
│   │   │   │   └── useFileUpload.ts        # Upload logic
│   │   │   └── store/
│   │   │       └── object-tree-store.ts    # Zustand store for tree state
│   │   │
│   │   ├── musical-objects/                # MusicalObject utilities
│   │   │   ├── utils/
│   │   │   │   ├── object-hierarchy.ts     # Parent/child relationship helpers
│   │   │   │   └── object-queries.ts       # Query/filter helpers
│   │   │   └── types/
│   │   │       └── object-extensions.ts    # Extended types (if needed)
│   │   │
│   │   ├── tools/                          # Tool system
│   │   │   ├── registry/
│   │   │   │   └── tool-registry.ts        # Plugin registry for tools
│   │   │   ├── types/
│   │   │   │   └── tool-interface.ts       # Tool contract (execute, metadata)
│   │   │   ├── definitions/                # Individual tool implementations
│   │   │   │   ├── separate-stems-tool.ts
│   │   │   │   ├── convert-to-midi-tool.ts
│   │   │   │   └── analyze-key-tool.ts
│   │   │   ├── components/
│   │   │   │   ├── ContextMenu.tsx         # Right-click tool menu
│   │   │   │   ├── ToolMenuItem.tsx        # Individual menu item
│   │   │   │   ├── JobProgressToast.tsx    # Progress notification
│   │   │   │   └── CommandPalette.tsx      # Global tool palette (Cmd+K)
│   │   │   ├── hooks/
│   │   │   │   ├── useToolExecution.ts     # Execute tool, track job
│   │   │   │   └── useContextMenu.ts       # Context menu logic
│   │   │   └── services/
│   │   │       └── job-poller.ts           # Poll backend for job status
│   │   │
│   │   ├── tracks/                         # Track area (projections)
│   │   │   ├── components/
│   │   │   │   ├── TrackArea.tsx           # Main track canvas container
│   │   │   │   ├── TrackList.tsx           # List of tracks
│   │   │   │   ├── TrackController.tsx     # Wrapper for track (M/S/H controls)
│   │   │   │   ├── TrackHeader.tsx         # Track name, controls
│   │   │   │   ├── TimelineRuler.tsx       # Top timeline with time markers
│   │   │   │   └── ViewModeSwitcher.tsx    # Waveform / MIDI / Sheet tabs
│   │   │   ├── hooks/
│   │   │   │   ├── useTrackControls.ts     # Mute, solo, hide logic
│   │   │   │   ├── useTrackSelection.ts    # Track selection/focus
│   │   │   │   └── useTrackProjection.ts   # Map objects → tracks
│   │   │   └── utils/
│   │   │       └── track-layout.ts         # Calculate track positions
│   │   │
│   │   ├── views/                          # Renderer implementations
│   │   │   ├── waveform/
│   │   │   │   ├── WaveformRenderer.tsx    # Canvas-based waveform view
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useWaveformCanvas.ts
│   │   │   │   └── utils/
│   │   │   │       └── waveform-utils.ts   # Peak calculation, zoom logic
│   │   │   ├── midi/
│   │   │   │   ├── MidiRenderer.tsx        # Piano roll renderer
│   │   │   │   ├── components/
│   │   │   │   │   └── PianoKeyboard.tsx   # Left piano keys
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useMidiCanvas.ts
│   │   │   │   └── utils/
│   │   │   │       └── midi-utils.ts       # Note rendering logic
│   │   │   └── sheet/
│   │   │       ├── SheetMusicRenderer.tsx  # VexFlow-based notation
│   │   │       └── utils/
│   │   │           └── midi-to-notation.ts # MIDI → notation conversion
│   │   │
│   │   ├── transport/                      # Playback controls
│   │   │   ├── components/
│   │   │   │   ├── TransportBar.tsx        # Container for transport controls
│   │   │   │   ├── TransportControls.tsx   # Play, pause, loop buttons
│   │   │   │   ├── TimeDisplay.tsx         # 00:00.0 time display
│   │   │   │   └── ProjectMetadata.tsx     # Tempo, key, time signature
│   │   │   └── hooks/
│   │   │       └── useTransport.ts         # Transport state (play/pause/seek)
│   │   │
│   │   ├── playback/                       # Audio playback engine
│   │   │   ├── audio-engine.ts             # Web Audio API manager
│   │   │   ├── track-mixer.ts              # Multi-track mixing logic
│   │   │   └── hooks/
│   │   │       └── useAudioPlayback.ts     # Playback hook
│   │   │
│   │   ├── projects/                       # Project management
│   │   │   ├── components/
│   │   │   │   ├── ProjectCard.tsx         # Project thumbnail card
│   │   │   │   ├── ProjectGrid.tsx         # Grid of projects
│   │   │   │   └── NewProjectDialog.tsx    # Create project modal
│   │   │   └── hooks/
│   │   │       └── useProjects.ts          # Fetch/create projects
│   │   │
│   │   ├── studio-shell/                   # Studio layout components
│   │   │   ├── components/
│   │   │   │   ├── AppBar.tsx              # Top app bar
│   │   │   │   ├── UserMenu.tsx            # User dropdown menu
│   │   │   │   └── StudioLayout.tsx        # 2-column layout logic
│   │   │   └── hooks/
│   │   │       └── useStudioLayout.ts      # Panel resize, collapse
│   │   │
│   │   ├── marketing/                      # Marketing page components
│   │   │   └── components/
│   │   │       ├── Hero.tsx                # Landing hero section
│   │   │       ├── FeatureSection.tsx      # Feature cards
│   │   │       ├── DemoVideo.tsx           # Embedded demo
│   │   │       └── Footer.tsx              # Site footer
│   │   │
│   │   └── shortcuts/                      # Keyboard shortcuts
│   │       ├── keyboard-handler.ts         # Global keyboard listener
│   │       ├── commands.ts                 # Command definitions
│   │       └── components/
│   │           └── CommandPalette.tsx      # Cmd+K palette (cmdk)
│   │
│   ├── components/                         # Shared UI components
│   │   ├── ui/                             # Design system primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── spinner.tsx
│   │   └── layout/                         # Layout components
│   │       ├── Container.tsx
│   │       ├── Section.tsx
│   │       └── Grid.tsx
│   │
│   └── lib/                                # Utilities, constants, config
│       ├── utils.ts                        # Generic helpers (cn, etc.)
│       ├── constants.ts                    # App constants
│       ├── theme.ts                        # Optional; prefer DESIGN_SYSTEM.md + Tailwind
│       └── validators.ts                   # Zod schemas (if needed)
│
├── public/                                 # Static assets
│   ├── logo.svg
│   ├── moises-inspired-hero.png
│   └── ...
│
├── tests/                                  # Test files
│   ├── unit/
│   │   ├── object-tree.test.ts
│   │   └── tool-execution.test.ts
│   └── integration/
│       └── project-workflow.test.ts
│
├── docs/                                   # Frontend-specific docs
│   ├── DEVELOPMENT_PLAN.md                 # This file's companion
│   ├── CURSOR_PROMPTS.md                   # Example prompts per phase
│   └── API_INTEGRATION.md                  # Backend integration guide
│
├── .env.example                            # Environment variables template
├── .env.local                              # Local environment (gitignored)
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts
└── README.md
```

---

## Key Structural Principles

### 1. App Router = Routes Only
- No business logic in `app/` folder
- Route files are thin wrappers that import from `src/`
- Route groups `(marketing)` and `(studio)` separate concerns

### 2. Feature Folders Are Self-Contained
Each feature folder contains:
- `components/` - UI components for that feature
- `hooks/` - React hooks for that feature
- `store/` or `services/` - State or business logic
- `utils/` or `types/` - Feature-specific helpers

Example: `src/features/tools/` contains everything related to tools.

### 3. Shared vs Feature-Specific
- `src/components/ui/` - Reusable across features (Button, Card)
- `src/features/*/components/` - Specific to that feature (TrackHeader)

### 4. API Integration Layers
```
Backend API
    ↓
src/api-client/endpoints/  (HTTP calls, DTOs)
    ↓
src/adapters/              (DTO → Domain model)
    ↓
src/features/              (Use domain models)
```

### 5. Types Location
- Core domain types → `src/types/`
- API types → `src/api-client/types.ts`
- Feature-specific types → `src/features/*/types/`

---

## Import Path Aliases (tsconfig.json)

Recommended aliases for cleaner imports:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/api-client/*": ["./src/api-client/*"]
    }
  }
}
```

Usage:
```typescript
import { Button } from '@/components/ui/button'
import { useObjectTree } from '@/features/object-tree/hooks/useObjectTree'
import { MusicalObject } from '@/types/musical-object'
```

---

## Folder Creation Order (for Cursor)

When setting up the structure, create folders in this order:

1. Core types and API client
```
src/types/
src/api-client/
src/adapters/
```

2. Design system
```
src/components/ui/
src/lib/
```

3. Feature folders (as needed per phase)
```
src/features/object-tree/
src/features/tools/
src/features/tracks/
src/features/views/
src/features/transport/
src/features/playback/
```

4. Route structure
```
app/(marketing)/
app/(studio)/
```

---

## File Naming Conventions

- **Components:** PascalCase (`ObjectPanel.tsx`)
- **Hooks:** camelCase with `use` prefix (`useObjectTree.ts`)
- **Utils:** camelCase (`waveform-utils.ts` or `waveformUtils.ts`)
- **Types:** PascalCase (`musical-object.ts` exports `MusicalObject` type)
- **Constants:** SCREAMING_SNAKE_CASE in file (`constants.ts`)

---

## Example: Creating a New Feature

Let's say you want to add a "Lyrics" feature:

1. Create feature folder:
```
src/features/lyrics/
  ├── components/
  │   ├── LyricsPanel.tsx
  │   └── LyricsEditor.tsx
  ├── hooks/
  │   └── useLyrics.ts
  ├── store/
  │   └── lyrics-store.ts
  └── types/
      └── lyrics-types.ts
```

2. Add to object types if needed:
```typescript
// src/types/musical-object.ts
export enum ObjectType {
  Audio = 'audio',
  Midi = 'midi',
  Lyrics = 'lyrics', // New
}
```

3. Register in tool registry (if it's a tool):
```typescript
// src/features/tools/definitions/extract-lyrics-tool.ts
export const extractLyricsTool: Tool = { ... }
```

4. Use in UI:
```typescript
// app/(studio)/project/[id]/page.tsx
import { LyricsPanel } from '@/features/lyrics/components/LyricsPanel'
```

---

## Integration Points

### Where Features Connect

| Feature | Depends On | Used By |
|---------|-----------|---------|
| object-tree | types, api-client | tools, tracks, playback |
| tools | object-tree, api-client | studio UI, shortcuts |
| tracks | object-tree, views | studio layout |
| views | types, playback | tracks |
| transport | playback | studio layout |
| playback | object-tree | transport, views |

**Critical Rule:** Avoid circular dependencies. Use dependency injection or shared stores.

---

## State Management Strategy

### Global State (Zustand)
- Object tree
- Project metadata
- Playback state
- User preferences

### Local State (useState)
- Component UI state (expanded, hovered)
- Form inputs
- Temporary selections

### Server State (TanStack Query or SWR - optional)
- Project list
- Job status
- User data

**Start simple:** Use Zustand for object tree, local state everywhere else. Refactor later if needed.

---

## This Structure Supports

✅ Modularity - Features are independent
✅ Scalability - Easy to add new tools/views
✅ Testability - Each feature can be tested in isolation
✅ Cursor-friendly - Clear boundaries for AI to understand
✅ Professional standards - Follows Next.js best practices

---

## Next Steps

1. Create the folder structure (can be done with a bash script or manually)
2. Start with Phase 1 (types) and work through the development plan
3. Use this document as a reference when Cursor asks "where should I put this file?"

---

**Note:** Not all folders will exist on day 1. Create them as you progress through the development phases.
