# Frontend Setup & Execution Plan

**Date**: January 24, 2026  
**Status**: Planning Phase  
**Version**: 1.0

---

## Table of Contents

1. [Framework Analysis](#framework-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Phase-by-Phase Execution Plan](#phase-by-phase-execution-plan)
6. [Future Considerations (DAW Interface)](#future-considerations-daw-interface)
7. [API Integration Strategy](#api-integration-strategy)
8. [Development Workflow](#development-workflow)

---

## Framework Analysis

### Is Next.js a Good Choice?

**✅ YES - Next.js is an excellent choice for this project**

#### Advantages for Music Assistant:

1. **Full-Stack Capabilities**
   - Can handle API routes if needed (though we have FastAPI backend)
   - Server-side rendering for better SEO (if public-facing later)
   - Static generation for performance

2. **React Ecosystem**
   - Rich component libraries (shadcn/ui, Material-UI, etc.)
   - Excellent state management (Zustand, Redux, Jotai)
   - Strong TypeScript support

3. **Audio Handling**
   - Web Audio API works perfectly in React/Next.js
   - Can use libraries like Tone.js, Howler.js, or native Web Audio API
   - File uploads handled easily with Next.js API routes or direct to FastAPI

4. **Real-Time Features**
   - WebSocket support for job status updates
   - Server-Sent Events (SSE) for streaming responses
   - Polling strategies for job status

5. **Performance**
   - Automatic code splitting
   - Image optimization built-in
   - Fast refresh for development

6. **Future-Proof**
   - Active development and large community
   - Easy to add features incrementally
   - Can evolve from simple UI to complex DAW-like interface

#### Potential Concerns:

1. **Server-Side Rendering Overhead**
   - **Solution**: Use client-side rendering for interactive features
   - Most of the app will be client-side anyway (audio processing UI)

2. **Bundle Size**
   - **Solution**: Code splitting, dynamic imports for heavy libraries
   - Audio libraries can be lazy-loaded

3. **Audio Engine Complexity**
   - **Solution**: Web Audio API is browser-native, works in any framework
   - Can use Web Workers for heavy processing
   - Consider WebAssembly for performance-critical audio operations

### Alternative Frameworks Considered:

**Vite + React**
- ✅ Faster dev server
- ✅ Simpler setup
- ❌ Less built-in features
- ❌ Would need to add routing, SSR manually

**SvelteKit**
- ✅ Excellent performance
- ✅ Simpler syntax
- ❌ Smaller ecosystem
- ❌ Less audio-specific libraries

**Vue 3 + Nuxt**
- ✅ Good performance
- ✅ Easy to learn
- ❌ Smaller React ecosystem
- ❌ Less TypeScript support

**Verdict**: Next.js is the best choice for this project.

---

## Can Next.js Handle a DAW-Like Interface?

**✅ YES - Absolutely!**

### Real-World Examples:

1. **Soundtrap** (Spotify) - Full DAW in browser
2. **BandLab** - Music creation platform
3. **Audiotool** - Web-based music production
4. **Amped Studio** - Browser DAW

All use similar tech stack: React/Next.js + Web Audio API + Canvas/WebGL

### Technical Capabilities:

#### 1. **Audio Processing**
```javascript
// Web Audio API (browser-native)
const audioContext = new AudioContext();
const source = audioContext.createBufferSource();
// Full audio graph manipulation
```

#### 2. **Real-Time Audio**
- ✅ Low-latency audio processing
- ✅ Audio routing and mixing
- ✅ Effects chains
- ✅ MIDI playback

#### 3. **Visualization**
- ✅ Canvas API for waveforms
- ✅ WebGL for 3D visualizations
- ✅ SVG for UI elements
- ✅ D3.js for data visualization

#### 4. **Performance**
- ✅ Web Workers for background processing
- ✅ WebAssembly for heavy computations
- ✅ OffscreenCanvas for rendering
- ✅ IndexedDB for local storage

#### 5. **UI Complexity**
- ✅ Drag-and-drop (react-dnd, dnd-kit)
- ✅ Timeline/sequencer components
- ✅ Piano roll interfaces
- ✅ Mixer interfaces
- ✅ Plugin interfaces

### Architecture for Future DAW:

```
┌─────────────────────────────────────────────────┐
│  Next.js Frontend                               │
│  ┌──────────────────────────────────────────┐  │
│  │  React Components (UI Layer)              │  │
│  │  - Timeline, Piano Roll, Mixer            │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Web Audio API (Audio Engine)            │  │
│  │  - AudioContext, Nodes, Routing           │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Web Workers (Background Processing)      │  │
│  │  - Audio analysis, FFT, etc.              │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  WebAssembly (Performance-Critical)     │  │
│  │  - Audio effects, DSP algorithms         │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  IndexedDB (Local Storage)               │  │
│  │  - Projects, presets, cache              │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────┐
│  FastAPI Backend (Your Current Backend)         │
│  - Job processing, file storage, AI agent       │
└─────────────────────────────────────────────────┘
```

**Conclusion**: Next.js can absolutely handle a DAW-like interface. The browser's Web Audio API is powerful enough, and Next.js provides the React ecosystem needed for complex UIs.

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js Frontend (Port 3000)                        │  │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │  │
│  │  │  Workstation   │  │  Chat Interface (Beta)   │   │  │
│  │  │  - Upload      │  │  - Message Input          │   │  │
│  │  │  - Job Queue   │  │  - Conversation History  │   │  │
│  │  │  - Results     │  │  - Agent Responses        │   │  │
│  │  │  - Downloads   │  │  - File Upload            │   │  │
│  │  └────────────────┘  └──────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Port 8000)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  /api/audio  │  │  /api/jobs   │  │  /api/chat   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
frontend/
├── app/                    # Next.js App Router
│   ├── (workstation)/      # Workstation routes
│   │   ├── page.tsx        # Main workstation page
│   │   ├── upload/         # Upload interface
│   │   └── jobs/           # Job management
│   ├── (chat)/             # Chat routes
│   │   ├── page.tsx        # Chat interface
│   │   └── [session]/      # Session-specific chat
│   └── api/                # Next.js API routes (if needed)
├── components/             # React components
│   ├── workstation/        # Workstation components
│   ├── chat/               # Chat components
│   ├── audio/              # Audio-specific components
│   └── ui/                 # Shared UI components
├── lib/                    # Utilities and helpers
│   ├── api/                # API client
│   ├── audio/              # Audio utilities
│   └── hooks/             # Custom React hooks
├── stores/                 # State management (Zustand)
└── types/                  # TypeScript types
```

---

## Technology Stack

### Core Framework
- **Next.js 14+** (App Router)
- **React 18+**
- **TypeScript**

### State Management
- **Zustand** (lightweight, perfect for this use case)
  - Alternative: Redux Toolkit if you prefer

### UI Components
- **shadcn/ui** (recommended - Tailwind-based, customizable)
  - Alternative: Material-UI, Chakra UI

### Styling
- **Tailwind CSS** (recommended with shadcn/ui)
  - Alternative: CSS Modules, Styled Components

### API Client
- **TanStack Query (React Query)** (for data fetching, caching, polling)
- **Axios** or **fetch** (HTTP client)

### Audio Handling
- **Web Audio API** (native browser API)
- **Tone.js** (optional - for advanced audio features)
- **Howler.js** (optional - for simple audio playback)

### Real-Time Updates
- **WebSocket** (for job status updates)
  - Library: `socket.io-client` or native WebSocket
- **Server-Sent Events (SSE)** (alternative for streaming)

### File Upload
- **react-dropzone** (drag-and-drop file uploads)

### Forms
- **React Hook Form** (form management)
- **Zod** (schema validation, works with React Hook Form)

### Date/Time
- **date-fns** (date formatting)

### Icons
- **Lucide React** (recommended with shadcn/ui)
  - Alternative: React Icons

### Development Tools
- **ESLint** (linting)
- **Prettier** (code formatting)
- **Husky** (git hooks)

---

## Project Structure

```
frontend/
├── .env.local              # Environment variables
├── .env.example           # Example env file
├── .gitignore
├── next.config.js         # Next.js configuration
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
├── package.json
├── README.md
│
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects to workstation)
│   ├── globals.css        # Global styles
│   │
│   ├── (workstation)/     # Workstation feature group
│   │   ├── layout.tsx     # Workstation layout
│   │   ├── page.tsx      # Main workstation page
│   │   ├── upload/
│   │   │   └── page.tsx  # Upload interface
│   │   └── jobs/
│   │       ├── page.tsx  # Job list
│   │       └── [id]/
│   │           └── page.tsx  # Job details
│   │
│   ├── (chat)/            # Chat feature group
│   │   ├── layout.tsx     # Chat layout
│   │   ├── page.tsx      # Chat interface
│   │   └── [session]/
│   │       └── page.tsx  # Session-specific chat
│   │
│   └── api/               # Next.js API routes (if needed)
│       └── proxy/         # API proxy routes (optional)
│
├── components/
│   ├── workstation/
│   │   ├── AudioUpload.tsx
│   │   ├── JobQueue.tsx
│   │   ├── JobCard.tsx
│   │   ├── JobStatus.tsx
│   │   ├── AudioPlayer.tsx
│   │   └── ResultsView.tsx
│   │
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageBubble.tsx
│   │   └── FileUpload.tsx
│   │
│   ├── audio/
│   │   ├── Waveform.tsx
│   │   ├── AudioVisualizer.tsx
│   │   └── AudioControls.tsx
│   │
│   └── ui/                # shadcn/ui components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
│
├── lib/
│   ├── api/
│   │   ├── client.ts      # API client setup
│   │   ├── audio.ts       # Audio endpoints
│   │   ├── jobs.ts         # Job endpoints
│   │   └── chat.ts         # Chat endpoints
│   │
│   ├── audio/
│   │   ├── player.ts      # Audio playback utilities
│   │   ├── waveform.ts    # Waveform generation
│   │   └── utils.ts       # Audio utilities
│   │
│   ├── hooks/
│   │   ├── useJobStatus.ts    # Poll job status
│   │   ├── useAudioUpload.ts  # Handle file uploads
│   │   ├── useChat.ts          # Chat functionality
│   │   └── useWebSocket.ts     # WebSocket connection
│   │
│   └── utils/
│       ├── cn.ts          # className utility (for Tailwind)
│       └── format.ts      # Formatting utilities
│
├── stores/
│   ├── audioStore.ts      # Audio state (Zustand)
│   ├── jobStore.ts        # Job state
│   └── chatStore.ts      # Chat state
│
├── types/
│   ├── api.ts             # API response types
│   ├── audio.ts           # Audio types
│   ├── job.ts             # Job types
│   └── chat.ts            # Chat types
│
└── public/
    ├── icons/
    └── images/
```

---

## Phase-by-Phase Execution Plan

### Phase 0: Setup & Foundation (Days 1-2)

**Goal**: Create project structure and basic setup

#### Tasks:
1. ✅ Initialize Next.js project
2. ✅ Configure TypeScript
3. ✅ Set up Tailwind CSS
4. ✅ Install and configure shadcn/ui
5. ✅ Set up ESLint and Prettier
6. ✅ Create folder structure
7. ✅ Set up environment variables
8. ✅ Create API client foundation
9. ✅ Set up state management (Zustand)

#### Deliverables:
- Working Next.js app with basic routing
- Tailwind CSS configured
- shadcn/ui components available
- API client structure
- TypeScript types for backend API

---

### Phase 1: Workstation - Core Features (Days 3-7)

**Goal**: Build the main workstation interface for model usage

#### 1.1: Audio Upload (Day 3)
- [ ] Create upload component with drag-and-drop
- [ ] File validation (format, size)
- [ ] Upload progress indicator
- [ ] Success/error handling
- [ ] Display uploaded audio info

#### 1.2: Job Creation (Day 4)
- [ ] Job type selection (stem_separation, midi_conversion)
- [ ] Job parameters form
- [ ] Create job API integration
- [ ] Job creation confirmation

#### 1.3: Job Queue & Status (Day 5-6)
- [ ] Job list component
- [ ] Job status cards (queued, running, succeeded, failed)
- [ ] Real-time status updates (polling or WebSocket)
- [ ] Progress indicators
- [ ] Error display

#### 1.4: Results & Downloads (Day 7)
- [ ] Results display component
- [ ] Audio player for results
- [ ] Download buttons for each output file
- [ ] File preview (if applicable)

#### Deliverables:
- Complete workstation interface
- Users can upload, process, and download results
- Real-time job status updates

---

### Phase 2: Chat Interface - Beta (Days 8-12)

**Goal**: Build beta chat interface for AI agent

#### 2.1: Chat UI Foundation (Day 8)
- [ ] Chat layout component
- [ ] Message list component
- [ ] Message input component
- [ ] Message bubble styling
- [ ] Scroll to bottom on new messages

#### 2.2: Chat API Integration (Day 9)
- [ ] Session management (create/get session)
- [ ] Send message API integration
- [ ] Message history API integration
- [ ] Error handling

#### 2.3: File Upload in Chat (Day 10)
- [ ] File upload in chat interface
- [ ] Upload with message
- [ ] Display uploaded file info
- [ ] Set as primary audio for session

#### 2.4: Enhanced Chat Features (Day 11-12)
- [ ] Typing indicators (if supported)
- [ ] Message timestamps
- [ ] Agent tool call indicators (optional)
- [ ] Job creation from chat (show job links)
- [ ] Link to workstation from chat

#### Deliverables:
- Beta chat interface
- Users can chat with AI agent and upload files
- Chat integrates with workstation (can view jobs)

---

### Phase 3: Polish & Integration (Days 13-15)

**Goal**: Polish UI, integrate features, add enhancements

#### 3.1: UI/UX Improvements (Day 13)
- [ ] Loading states
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Responsive design
- [ ] Dark mode (optional)

#### 3.2: Feature Integration (Day 14)
- [ ] Navigation between workstation and chat
- [ ] Shared audio context
- [ ] Job links from chat to workstation
- [ ] Consistent styling

#### 3.3: Testing & Bug Fixes (Day 15)
- [ ] Test all workflows
- [ ] Fix bugs
- [ ] Performance optimization
- [ ] Accessibility improvements

#### Deliverables:
- Polished, integrated frontend
- All features working together
- Good user experience

---

### Phase 4: Advanced Features (Future)

**Goal**: Add advanced features as needed

#### Potential Features:
- [ ] Audio visualization (waveforms, spectrograms)
- [ ] Audio preview before processing
- [ ] Batch processing
- [ ] Job history persistence
- [ ] User preferences
- [ ] Keyboard shortcuts
- [ ] Advanced filtering/search

---

## Future Considerations (DAW Interface)

### Timeline for DAW Features

**Phase 5: Basic Audio Engine (Future)**
- Web Audio API integration
- Audio playback controls
- Basic waveform visualization
- Timeline component

**Phase 6: MIDI Editor (Future)**
- Piano roll interface
- MIDI note editing
- MIDI playback
- Note quantization

**Phase 7: Mixer Interface (Future)**
- Multi-track mixer
- Volume/pan controls
- Effects chains
- Bus routing

**Phase 8: Advanced Features (Future)**
- Real-time audio effects
- Audio recording
- MIDI input
- Plugin system

### Technical Requirements for DAW:

1. **Web Audio API**
   - AudioContext for audio processing
   - AudioNodes for routing
   - AudioWorklet for custom processing

2. **Performance**
   - Web Workers for heavy processing
   - WebAssembly for DSP algorithms
   - RequestAnimationFrame for smooth UI

3. **Storage**
   - IndexedDB for project storage
   - Local file system API (if available)
   - Cloud sync (optional)

4. **Libraries to Consider**
   - **Tone.js**: Advanced audio framework
   - **Wavesurfer.js**: Waveform visualization
   - **Pizzicato.js**: Sound effects
   - **MidiWriterJS**: MIDI file generation

---

## API Integration Strategy

### API Client Structure

```typescript
// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const apiClient = {
  audio: {
    upload: (file: File) => Promise<AudioResponse>,
    download: (audioId: string) => Promise<Blob>,
    getFile: (path: string) => Promise<Blob>,
  },
  jobs: {
    create: (data: JobCreate) => Promise<JobResponse>,
    get: (jobId: string) => Promise<JobResponse>,
    list: (filters?: JobFilters) => Promise<JobResponse[]>,
  },
  chat: {
    createSession: () => Promise<SessionResponse>,
    sendMessage: (sessionId: string, message: string) => Promise<ChatResponse>,
    uploadWithMessage: (sessionId: string, file: File, message?: string) => Promise<ChatResponse>,
    getHistory: (sessionId: string) => Promise<HistoryResponse>,
  },
};
```

### Real-Time Updates

**Option 1: Polling (Simpler)**
```typescript
// Poll job status every 2 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchJobStatus(jobId);
  }, 2000);
  return () => clearInterval(interval);
}, [jobId]);
```

**Option 2: WebSocket (Better)**
```typescript
// WebSocket connection for real-time updates
const ws = new WebSocket('ws://localhost:8000/ws/jobs');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  updateJobStatus(update);
};
```

**Option 3: Server-Sent Events (SSE)**
```typescript
// SSE for streaming updates
const eventSource = new EventSource('/api/jobs/stream');
eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  updateJobStatus(update);
};
```

**Recommendation**: Start with polling (simpler), upgrade to WebSocket later if needed.

---

## Development Workflow

### Environment Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. **Run Development Server**
```bash
npm run dev
```

### Development Commands

```bash
# Development
npm run dev          # Start dev server (port 3000)

# Build
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run type-check   # TypeScript type checking
```

### Git Workflow

1. Create feature branch: `git checkout -b feature/workstation`
2. Make changes
3. Commit: `git commit -m "Add workstation upload"`
4. Push: `git push origin feature/workstation`
5. Create PR

---

## Next Steps

### Immediate Actions:

1. **Review this plan** - Make sure it aligns with your vision
2. **Decide on UI library** - shadcn/ui recommended
3. **Set up project** - Initialize Next.js
4. **Start Phase 0** - Foundation setup

### Questions to Consider:

1. **UI Design**: Do you have design mockups, or should we start with a clean, functional UI?
2. **Authentication**: Will you add user auth later? (affects session management)
3. **Deployment**: Where will frontend be deployed? (affects API URL configuration)
4. **Real-Time**: Do you want WebSocket from the start, or start with polling?

---

## Summary

✅ **Next.js is an excellent choice** for this project  
✅ **Next.js can handle DAW-like interfaces** (proven by many examples)  
✅ **Phased approach** allows incremental development  
✅ **Modern tech stack** ensures maintainability and performance  

**Ready to start?** Let's begin with Phase 0: Setup & Foundation!
