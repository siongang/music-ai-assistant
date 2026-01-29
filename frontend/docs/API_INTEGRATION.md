# API Integration Guide - AI Music Agent Frontend

This document explains how the Next.js frontend integrates with the FastAPI backend, including API client structure, adapter pattern, and example workflows.

---

## Backend Overview

**Base URL:** `http://localhost:8000` (development)

**Tech Stack:**
- FastAPI (Python)
- PostgreSQL database
- Celery for async jobs
- Audio processing: Demucs (stems), basic-pitch (MIDI)

**Key Endpoints:**
- `/api/audio` - Audio upload/download
- `/api/jobs` - Job management and status
- `/api/chat` - AI agent chat interface

---

## Architecture: 3-Layer Integration

```
┌─────────────────────────────────────────────┐
│  Frontend App (React Components)            │
│  Uses: MusicalObject, Project (App Types)   │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  Adapters (src/adapters/)                   │
│  Transform: API DTOs ↔ App Models           │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  API Client (src/api-client/)               │
│  Typed HTTP calls to backend                │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  FastAPI Backend                            │
└─────────────────────────────────────────────┘
```

### Why This Architecture?

1. **Separation of Concerns**
   - API client handles HTTP, errors, retries
   - Adapters handle data transformation
   - App code works with domain models, not API DTOs

2. **Flexibility**
   - Backend API can change without breaking app logic
   - Easy to mock API client for testing
   - Can swap backend entirely if needed

3. **Type Safety**
   - API types defined in one place
   - App types separate and domain-focused
   - TypeScript catches mismatches

---

## API Client Structure

### Base Client

**File:** `src/api-client/client.ts`

```typescript
export class ApiClient {
  private baseUrl: string
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`)
    if (!response.ok) throw new ApiError(response.status, await response.text())
    return response.json()
  }
  
  async post<T>(endpoint: string, body: any): Promise<T> {
    // Similar implementation
  }
  
  // put, delete methods...
}
```

### Endpoint-Specific Functions

**File:** `src/api-client/endpoints/jobs.ts`

```typescript
export async function getJob(jobId: string): Promise<JobDTO> {
  const client = new ApiClient(API_BASE_URL)
  return client.get<JobDTO>(`/api/jobs/${jobId}`)
}

export async function pollJobUntilComplete(
  jobId: string,
  interval: number = 2000
): Promise<JobDTO> {
  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      try {
        const job = await getJob(jobId)
        if (job.status === 'completed') {
          clearInterval(poll)
          resolve(job)
        } else if (job.status === 'failed') {
          clearInterval(poll)
          reject(new Error(job.error || 'Job failed'))
        }
      } catch (error) {
        clearInterval(poll)
        reject(error)
      }
    }, interval)
  })
}
```

---

## API Data Transfer Objects (DTOs)

**File:** `src/api-client/types.ts`

```typescript
// Backend Job model
export interface JobDTO {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  job_type: string  // 'separate_stems', 'to_midi', etc.
  input_audio_id: string
  result: JobResultDTO | null
  error: string | null
  created_at: string
  updated_at: string
}

export interface JobResultDTO {
  artifacts: Array<{
    id: string
    artifact_type: string
    path: string
    metadata?: Record<string, any>
  }>
}

export interface AudioUploadResponseDTO {
  id: string
  filename: string
  size: number
  duration: number | null
}
```

### Key Backend Models

Based on `backend/app/models/`:

1. **Audio** (`audio.py`)
   - id, filename, path, project_id, metadata

2. **Job** (`job.py`)
   - id, status, job_type, input_audio_id, result, error

3. **Artifact** (`artifact.py`)
   - id, job_id, artifact_type, path, metadata

4. **Session** (`session.py`)
   - id, project_id, messages (for chat)

---

## Adapters: API → App Models

**File:** `src/adapters/musical-object.ts`

```typescript
import { JobDTO } from '@/api-client/types'
import { MusicalObject, ObjectType } from '@/types/musical-object'

export function jobToMusicalObject(job: JobDTO): MusicalObject {
  if (!job.result) {
    throw new Error('Job has no result')
  }
  
  // Convert job artifacts to MusicalObject children
  const children: MusicalObject[] = job.result.artifacts.map(artifact => ({
    id: artifact.id,
    name: artifact.metadata?.filename || 'Unnamed',
    type: artifactTypeToObjectType(artifact.artifact_type),
    parentId: job.input_audio_id,
    children: [],
    metadata: artifact.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  
  // Return parent object (the input audio)
  return {
    id: job.input_audio_id,
    name: 'Audio File', // Fetch from Audio model if needed
    type: ObjectType.Audio,
    parentId: null,
    children,
    metadata: {},
    createdAt: new Date(job.created_at),
    updatedAt: new Date(job.updated_at),
  }
}

function artifactTypeToObjectType(type: string): ObjectType {
  switch (type) {
    case 'audio': return ObjectType.Audio
    case 'midi': return ObjectType.Midi
    case 'stems': return ObjectType.Stems
    default: return ObjectType.Audio
  }
}
```

---

## Example Workflows

### Workflow 1: Upload Audio File

**User Action:** Drag .wav file into ObjectPanel

**Frontend Flow:**

1. `FileUpload.tsx` component receives file
2. Calls `useFileUpload` hook
3. Hook calls `uploadAudio()` from `api-client/endpoints/audio.ts`
4. API client uploads file to `/api/audio/upload`
5. Backend returns `AudioUploadResponseDTO`
6. Adapter converts DTO → `MusicalObject`
7. Object added to `object-tree-store`
8. UI updates to show new object

**Code Example:**

```typescript
// In FileUpload.tsx
const { uploadFile } = useFileUpload()

const handleDrop = async (file: File) => {
  try {
    const object = await uploadFile(file, projectId)
    // object is now a MusicalObject
  } catch (error) {
    toast.error('Upload failed')
  }
}
```

```typescript
// In useFileUpload.ts
export function useFileUpload() {
  const addObject = useObjectTreeStore(state => state.addObject)
  
  const uploadFile = async (file: File, projectId: string) => {
    // 1. Upload to backend
    const response = await uploadAudio(file, projectId)
    
    // 2. Convert to MusicalObject
    const object: MusicalObject = {
      id: response.id,
      name: file.name,
      type: ObjectType.Audio,
      parentId: null,
      children: [],
      metadata: {
        duration: response.duration,
        size: response.size,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // 3. Add to store
    addObject(object)
    
    return object
  }
  
  return { uploadFile }
}
```

---

### Workflow 2: Apply Tool (Separate Stems)

**User Action:** Right-click audio object → "Separate Stems"

**Frontend Flow:**

1. `ContextMenu.tsx` calls tool.execute()
2. Tool calls backend: `POST /api/jobs/separate_stems`
3. Backend creates Job, starts Celery task
4. Backend returns `{ job_id: '...' }`
5. Frontend starts polling: `pollJobUntilComplete(jobId)`
6. Shows progress toast with status
7. When complete, adapter converts Job → MusicalObject[]
8. New stem objects added to tree as children

**Code Example:**

```typescript
// In separate-stems-tool.ts
export const separateStemsTool: Tool = {
  id: 'separate-stems',
  name: 'Separate Stems',
  icon: '🎛️',
  inputTypes: [ObjectType.Audio],
  outputType: ObjectType.Stems,
  
  async execute(input: MusicalObject): Promise<MusicalObject> {
    // 1. Create job
    const response = await fetch(`${API_BASE_URL}/api/jobs/separate_stems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio_id: input.id }),
    })
    const { job_id } = await response.json()
    
    // 2. Poll for completion
    const job = await pollJobUntilComplete(job_id)
    
    // 3. Convert to MusicalObject
    return jobToMusicalObject(job)
  },
}
```

```typescript
// In useToolExecution.ts
export function useToolExecution() {
  const addObject = useObjectTreeStore(state => state.addObject)
  
  const executeTool = async (tool: Tool, object: MusicalObject) => {
    toast.info(`Running ${tool.name}...`)
    
    try {
      const result = await tool.execute(object)
      
      // Add result children to tree
      result.children.forEach(child => {
        addObject(child, object.id)
      })
      
      toast.success(`${tool.name} completed!`)
    } catch (error) {
      toast.error(`${tool.name} failed`)
    }
  }
  
  return { executeTool }
}
```

---

### Workflow 3: Chat with Agent

**User Action:** Type message in chat panel

**Frontend Flow:**

1. User types: "Separate the drums from song.wav"
2. Frontend calls `POST /api/chat`
3. Backend AI agent processes request
4. Agent calls tools internally
5. Backend returns chat message with steps
6. Frontend polls for updated object tree
7. New objects appear automatically

**Code Example:**

```typescript
// In chat.ts endpoint
export async function sendMessage(
  projectId: string,
  message: string
): Promise<ChatMessageDTO> {
  const client = new ApiClient(API_BASE_URL)
  return client.post<ChatMessageDTO>('/api/chat', {
    project_id: projectId,
    message,
  })
}
```

```typescript
// In ChatPanel.tsx
const handleSend = async (message: string) => {
  const response = await sendMessage(projectId, message)
  
  // Display agent response
  setChatMessages(prev => [...prev, response])
  
  // Refresh object tree (agent may have created objects)
  await refreshObjectTree()
}
```

---

## Backend Endpoints Reference

### Audio Endpoints

```
POST   /api/audio/upload
  Body: multipart/form-data (file)
  Response: { id, filename, size, duration }

GET    /api/audio/{audio_id}
  Response: Audio metadata

GET    /api/audio/{audio_id}/download
  Response: Binary audio file
```

### Job Endpoints

```
POST   /api/jobs/separate_stems
  Body: { audio_id: string }
  Response: { job_id: string }

POST   /api/jobs/to_midi
  Body: { audio_id: string }
  Response: { job_id: string }

GET    /api/jobs/{job_id}
  Response: JobDTO

GET    /api/jobs
  Query: ?project_id=...
  Response: JobDTO[]
```

### Chat Endpoints

```
POST   /api/chat
  Body: { project_id: string, message: string }
  Response: { message: string, steps: [...] }

GET    /api/chat/history
  Query: ?project_id=...
  Response: ChatMessageDTO[]
```

---

## Error Handling

### API Client Errors

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string
  ) {
    super(message)
  }
}
```

### Usage in Components

```typescript
try {
  await uploadAudio(file, projectId)
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // Redirect to login
    } else if (error.status === 413) {
      toast.error('File too large')
    } else {
      toast.error(error.message)
    }
  } else {
    toast.error('An unexpected error occurred')
  }
}
```

---

## Environment Configuration

**File:** `.env.local`

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws  # For real-time updates (future)
```

**File:** `src/api-client/config.ts`

```typescript
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export const DEFAULT_TIMEOUT = 30000  // 30 seconds
```

---

## Testing the Integration

### Manual Testing

1. Start backend:
```bash
cd backend
python -m app.main
```

2. Start frontend:
```bash
cd frontend
npm run dev
```

3. Test upload:
   - Drag .wav file → should appear in object tree
   - Check network tab → POST /api/audio/upload

4. Test tool execution:
   - Right-click object → Separate Stems
   - Check network tab → POST /api/jobs/separate_stems
   - See polling requests → GET /api/jobs/{id}

### Automated Testing

**File:** `tests/integration/api-client.test.ts`

```typescript
import { uploadAudio } from '@/api-client/endpoints/audio'
import { getJob } from '@/api-client/endpoints/jobs'

describe('API Client', () => {
  it('should upload audio file', async () => {
    const file = new File(['audio data'], 'test.wav', { type: 'audio/wav' })
    const response = await uploadAudio(file, 'project-1')
    expect(response.id).toBeDefined()
  })
  
  it('should poll job until complete', async () => {
    // Mock API
    const job = await getJob('job-123')
    expect(job.status).toBe('completed')
  })
})
```

---

## Future Enhancements

### 1. WebSocket for Real-Time Updates

Replace polling with WebSocket connection:

```typescript
// src/api-client/websocket.ts
export function connectWebSocket(projectId: string) {
  const ws = new WebSocket(`${WS_URL}/projects/${projectId}`)
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data)
    // Update object tree in real-time
  }
}
```

### 2. Optimistic Updates

Update UI before backend confirms:

```typescript
// Add object to tree immediately
addObject(optimisticObject)

try {
  const confirmed = await uploadAudio(file, projectId)
  updateObject(optimisticObject.id, confirmed)
} catch (error) {
  removeObject(optimisticObject.id)
  toast.error('Upload failed')
}
```

### 3. Request Caching

Cache GET requests to reduce backend load:

```typescript
// Use TanStack Query
const { data: job } = useQuery({
  queryKey: ['job', jobId],
  queryFn: () => getJob(jobId),
  staleTime: 5000,
})
```

---

## Troubleshooting

### Issue: CORS errors

**Solution:** Backend must allow frontend origin.

In `backend/app/main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Jobs never complete

**Solution:** Check Celery worker is running.

```bash
cd backend
celery -A app.celery_app worker --loglevel=info
```

### Issue: File uploads fail with 413

**Solution:** Increase max file size in backend.

In `backend/app/main.py`:
```python
app.add_middleware(
    RequestSizeLimitMiddleware,
    max_size=100 * 1024 * 1024  # 100 MB
)
```

---

## Summary

- **API Client:** Typed HTTP calls to backend
- **Adapters:** Transform DTOs to app models
- **Workflows:** Upload → Apply Tool → Display Result
- **Error Handling:** Graceful error messages, retry logic
- **Testing:** Manual + automated tests

This architecture keeps the frontend decoupled from backend implementation details, making it easy to iterate on both sides independently.
