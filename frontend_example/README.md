# Music Assistant Frontend

Modern Next.js frontend for the Music Assistant platform. Provides a workstation interface for audio processing and a beta chat interface for AI-powered music assistance.

## Features

### Workstation Interface
- **Audio Upload**: Drag-and-drop file upload with validation
- **Job Management**: Create and monitor processing jobs (stem separation, MIDI conversion)
- **Real-Time Status**: Live job status updates with progress tracking
- **Results View**: View and download processed audio files
- **Audio Preview**: Play audio files directly in the browser

### Chat Interface (Beta)
- **AI Chat**: Conversational interface with the Music Assistant AI agent
- **File Upload**: Upload audio files directly in chat
- **Session Management**: Persistent chat sessions with history
- **Job Integration**: View and manage jobs created through chat

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Audio**: Web Audio API (native)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:8000`
- npm or yarn package manager

### Installation

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. **Run development server:**
```bash
npm run dev
```

5. **Open in browser:**
```
http://localhost:3000
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (workstation)/     # Workstation routes
│   ├── (chat)/            # Chat routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── workstation/       # Workstation components
│   ├── chat/              # Chat components
│   ├── audio/             # Audio components
│   └── ui/                # UI components (shadcn/ui)
├── lib/                   # Utilities and helpers
│   ├── api/               # API client
│   ├── audio/             # Audio utilities
│   └── hooks/             # Custom React hooks
├── stores/                # State management (Zustand)
└── types/                 # TypeScript types
```

## Development

### Available Scripts

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

### Development Workflow

1. **Start backend API** (in separate terminal):
```bash
cd ../backend
uvicorn app.main:app --reload
```

2. **Start frontend dev server**:
```bash
npm run dev
```

3. **Open browser**: `http://localhost:3000`

## API Integration

The frontend communicates with the FastAPI backend running on `http://localhost:8000/api`.

### Key Endpoints

- **Audio**: `/api/audio` - Upload and download audio files
- **Jobs**: `/api/jobs` - Create and manage processing jobs
- **Chat**: `/api/chat` - Chat with AI agent

See backend API documentation at `http://localhost:8000/api/docs` for full API reference.

## Architecture

### State Management

- **Zustand**: Lightweight state management for global state
  - `audioStore`: Audio upload state
  - `jobStore`: Job queue and status
  - `chatStore`: Chat sessions and messages

### Data Fetching

- **TanStack Query**: Handles API calls, caching, and polling
  - Automatic refetching for job status
  - Caching for better performance
  - Optimistic updates

### Real-Time Updates

- **Polling**: Job status updates via polling (every 2 seconds)
- **WebSocket**: Future enhancement for real-time updates

## Features Roadmap

### Phase 1: Core Workstation ✅
- [x] Audio upload
- [x] Job creation
- [x] Job status monitoring
- [x] Results download

### Phase 2: Chat Interface ✅
- [x] Chat UI
- [x] File upload in chat
- [x] Session management
- [x] Message history

### Phase 3: Enhancements (Future)
- [ ] Audio visualization (waveforms, spectrograms)
- [ ] Batch processing
- [ ] Job history persistence
- [ ] User preferences
- [ ] Dark mode
- [ ] Keyboard shortcuts

### Phase 4: Advanced Features (Future)
- [ ] Real-time audio preview
- [ ] Audio editing capabilities
- [ ] MIDI editor interface
- [ ] DAW-like features

## Future: DAW Interface

The frontend is designed to support future DAW-like features:

- **Web Audio API**: Native browser audio processing
- **Web Workers**: Background audio processing
- **WebAssembly**: Performance-critical audio operations
- **Canvas/WebGL**: Audio visualization

See `FRONTEND_SETUP_PLAN.md` for detailed architecture.

## Troubleshooting

### CORS Errors
Ensure backend CORS is configured to allow `http://localhost:3000`

### API Connection Failed
Check that backend is running on `http://localhost:8000`

### File Upload Fails
- Check file size limits (backend default: 100MB)
- Verify file format is supported (MP3, WAV, FLAC, etc.)

### Job Status Not Updating
- Check polling interval in `useJobStatus` hook
- Verify API endpoint is correct
- Check browser console for errors

## Documentation

- **[FRONTEND_SETUP_PLAN.md](./FRONTEND_SETUP_PLAN.md)**: Detailed setup and architecture plan
- **[EXECUTION_PLAN.md](./EXECUTION_PLAN.md)**: Step-by-step execution plan
- **[Backend README](../backend/README.md)**: Backend API documentation

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Your License Here]

---

**Built with Next.js, React, and TypeScript**
