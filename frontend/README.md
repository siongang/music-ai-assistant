# AI Music Agent - Frontend

A Next.js-based music workstation for project-centric audio manipulation using AI-powered tools.

## 🎯 Project Vision

**NOT a DAW.** This is a project-centric music workspace where:
- **MusicalObjects** exist (audio, MIDI, derived items)
- **Tools** operate on objects and produce new objects
- **Views** (waveform/MIDI/sheet) render objects without owning data
- **Object tree** is the single source of truth; tracks are projections

## 🏗️ Architecture

```
app/                # Next.js App Router (routes only)
  ├── (marketing)/  # Landing pages
  └── (studio)/     # Project workspace

src/                # All business logic
  ├── api-client/   # Backend integration
  ├── adapters/     # DTO transformations
  ├── types/        # Core domain types
  ├── features/     # Domain modules
  └── components/   # Shared UI
```

## 📚 Documentation

Before writing any code, read these documents:

1. **[START_HERE.md](./START_HERE.md)** ⭐ - **READ THIS FIRST** - Quick start guide
2. **[MVP_ROADMAP.md](./MVP_ROADMAP.md)** - Streamlined path to working MVP (~20-25 hours)
3. **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** - Complete development roadmap with all phases
4. **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - Detailed folder structure explanation
5. **[docs/CURSOR_PROMPTS.md](./docs/CURSOR_PROMPTS.md)** - Ready-to-use prompts for each phase
6. **[docs/API_INTEGRATION.md](./docs/API_INTEGRATION.md)** - Backend integration guide

## 🚀 Quick Start

### 1. Setup Folder Structure

```bash
chmod +x setup-structure.sh
./setup-structure.sh
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🎨 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Audio:** Web Audio API
- **Canvas Rendering:** Canvas API (waveforms/MIDI)
- **Sheet Music:** VexFlow
- **Command Palette:** cmdk
- **Icons:** Lucide React

## 🛠️ Development with Cursor

This project is designed for **iterative development with Cursor**. Follow these steps:

### Step 1: Read the Plan
Start with `DEVELOPMENT_PLAN.md` to understand the 24 phases.

### Step 2: Copy Prompts
Open `docs/CURSOR_PROMPTS.md` and copy the prompt for your current phase.

### Step 3: Paste into Cursor
Paste the prompt into Cursor Composer or Chat.

### Step 4: Review Code
Review the generated code, test in the browser, and iterate if needed.

### Step 5: Move to Next Phase
Only move to the next phase when the current one is complete and tested.

## 📋 Development Phases Overview

### MVP Phases (Build First)
| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Foundation Setup | ✅ Complete |
| 1-4 | Types, API, Adapters, State | 🔲 Next |
| 5-8 | Layout & UI Shell | 🔲 |
| 9-11 | Object Panel & Tracks | 🔲 |
| 12 | Waveform Renderer | 🔲 |
| 15-17 | Tool System (Stems Only) | 🔲 |
| 18 | Audio Playback | 🔲 |
| 19-20 | Project Management | 🔲 |

### Future Phases (Add Later)
| Phase | Focus | When |
|-------|-------|------|
| 13 | MIDI Renderer | After backend MIDI support |
| 14 | Sheet Music Renderer | After Phase 13 |
| 21-24 | Shortcuts, Marketing, Polish | Post-MVP |

**See MVP_ROADMAP.md for the streamlined development path.**

## 🎯 Key Architectural Decisions

### 1. Object Tree is Source of Truth
The object tree (in Zustand store) is the single source of truth. Tracks are just views/projections of selected objects.

### 2. Tools are Contextual
Tools appear in right-click context menus and a global command palette (Cmd+K). No separate pages per tool.

### 3. Views Don't Own Data
Waveform, MIDI, and sheet music views are pure renderers. They receive data as props and render it. They don't manage state.

### 4. Backend via Typed Client
All backend communication goes through `src/api-client/`, then through adapters. App code never sees raw API DTOs.

### 5. Feature Folders are Self-Contained
Each feature (tools, tracks, views) has its own components, hooks, and utils. Shared code goes in `src/components/` or `src/lib/`.

## 🎨 Design System

Inspired by **Moises.ai**:

- **Colors:**
  - Background: `#0A0A0A`
  - Surface: `#1A1A1A`
  - Accent: `#00E5FF` (cyan)
  - Text: `#FFFFFF` / `#A0A0A0`
- **Typography:** Inter or Geist Sans
- **Spacing:** 4px grid (Tailwind default)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test
npm test object-tree

# Watch mode
npm test -- --watch
```

## 📦 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
npm test             # Run tests
```

## 🔗 Backend Integration

The frontend communicates with a FastAPI backend at `http://localhost:8000`.

**Key endpoints:**
- `POST /api/audio/upload` - Upload audio files
- `POST /api/jobs/separate_stems` - Create stem separation job
- `GET /api/jobs/{id}` - Get job status
- `POST /api/chat` - Chat with AI agent

See `docs/API_INTEGRATION.md` for details.

## 📖 Code Examples

### Adding an Object to the Tree

```typescript
import { useObjectTree } from '@/features/object-tree/hooks/useObjectTree'

const { addObject } = useObjectTree()

const newObject: MusicalObject = {
  id: 'audio-123',
  name: 'song.wav',
  type: ObjectType.Audio,
  parentId: null,
  children: [],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
}

addObject(newObject)
```

### Executing a Tool

```typescript
import { useToolExecution } from '@/features/tools/hooks/useToolExecution'

const { executeTool } = useToolExecution()

const handleSeparateStems = async (object: MusicalObject) => {
  const tool = toolRegistry.getTool('separate-stems')
  if (tool) {
    await executeTool(tool, object)
  }
}
```

### Rendering a Waveform

```typescript
import { WaveformRenderer } from '@/features/views/waveform/WaveformRenderer'

<TrackController object={audioObject}>
  <WaveformRenderer
    audioData={peaks}
    duration={120}
    zoom={1}
    scrollX={0}
  />
</TrackController>
```

## 🐛 Troubleshooting

### Issue: API calls fail with CORS error
**Solution:** Ensure backend has CORS middleware configured to allow `http://localhost:3000`.

### Issue: Object tree not updating
**Solution:** Check that you're using the Zustand store actions, not mutating state directly.

### Issue: Waveform not rendering
**Solution:** Verify that Canvas API is supported and audio data is properly formatted (Float32Array).

## 🤝 Contributing

1. Complete phases in order
2. Test each phase before moving on
3. Follow TypeScript strict mode
4. Use the design system components
5. Write tests for critical paths

## 📄 License

MIT

## 🙏 Acknowledgments

- **Design inspiration:** Moises.ai
- **Architecture:** Influenced by VSCode's extension model
- **Development approach:** Optimized for Cursor AI assistance

---

**Ready to build?** Start by reading `DEVELOPMENT_PLAN.md` and then copy the Phase 1 prompt from `docs/CURSOR_PROMPTS.md`!
