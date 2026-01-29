# Frontend Execution Plan

**Project**: Music Assistant Frontend  
**Start Date**: January 24, 2026  
**Status**: Ready to Begin

---

## Overview

This document provides a detailed, step-by-step execution plan for building the Music Assistant frontend. The frontend will be built in phases, starting with the workstation interface and then adding the beta chat feature.

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Backend API running on `http://localhost:8000`
- [ ] Basic understanding of React and TypeScript
- [ ] Code editor (VS Code recommended)

---

## Phase 0: Project Setup (2-3 hours)

### Step 0.1: Initialize Next.js Project

```bash
cd /home/sion/code/music-assistant
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**Options selected:**
- TypeScript: Yes
- Tailwind CSS: Yes
- App Router: Yes
- src/ directory: No (use root)
- Import alias: @/*

### Step 0.2: Install Core Dependencies

```bash
cd frontend
npm install zustand @tanstack/react-query axios react-dropzone react-hook-form zod date-fns
npm install -D @types/node @types/react @types/react-dom
```

### Step 0.3: Install UI Library (shadcn/ui)

```bash
npx shadcn-ui@latest init
```

**Configuration:**
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Install initial components:**
```bash
npx shadcn-ui@latest add button input card dialog toast progress badge
```

### Step 0.4: Set Up Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Create `.env.example`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Step 0.5: Configure TypeScript Paths

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Step 0.6: Create Folder Structure

```bash
mkdir -p app/\(workstation\)/upload
mkdir -p app/\(workstation\)/jobs/\[id\]
mkdir -p app/\(chat\)/\[session\]
mkdir -p components/workstation
mkdir -p components/chat
mkdir -p components/audio
mkdir -p components/ui
mkdir -p lib/api
mkdir -p lib/audio
mkdir -p lib/hooks
mkdir -p lib/utils
mkdir -p stores
mkdir -p types
```

### Step 0.7: Set Up ESLint and Prettier

```bash
npm install -D eslint-config-prettier prettier
```

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Step 0.8: Create Base Types

Create `types/api.ts` with types matching backend schemas.

### Step 0.9: Create API Client Foundation

Create `lib/api/client.ts` with base API client setup.

### Step 0.10: Test Setup

```bash
npm run dev
```

Visit `http://localhost:3000` - should see Next.js welcome page.

**✅ Phase 0 Complete**: Project initialized and ready for development.

---

## Phase 1: Workstation Interface (5 days)

### Day 1: Audio Upload Component

**Goal**: Users can upload audio files

#### Tasks:
1. Create `components/workstation/AudioUpload.tsx`
   - Drag-and-drop zone
   - File input
   - File validation
   - Upload progress
   - Error handling

2. Create `lib/hooks/useAudioUpload.ts`
   - Handle file upload logic
   - API integration
   - State management

3. Create `app/(workstation)/upload/page.tsx`
   - Upload page layout
   - Integrate AudioUpload component

4. Test upload functionality

**Acceptance Criteria:**
- [ ] User can drag and drop audio files
- [ ] User can click to select files
- [ ] File format validation (MP3, WAV, FLAC, etc.)
- [ ] File size validation (max 100MB)
- [ ] Upload progress indicator
- [ ] Success message with audio_id
- [ ] Error messages for failures

---

### Day 2: Job Creation

**Goal**: Users can create processing jobs

#### Tasks:
1. Create `components/workstation/JobCreator.tsx`
   - Job type selector (stem_separation, midi_conversion)
   - Parameter inputs
   - Submit button

2. Create `lib/api/jobs.ts`
   - `createJob()` function
   - Type definitions

3. Update workstation page to include job creation
   - Show uploaded audio
   - Allow job creation from uploaded audio

4. Test job creation

**Acceptance Criteria:**
- [ ] User can select job type
- [ ] User can see uploaded audio
- [ ] User can create job with selected audio
- [ ] Job creation shows success message
- [ ] Job ID is displayed
- [ ] Error handling works

---

### Day 3: Job Queue Display

**Goal**: Users can see all their jobs

#### Tasks:
1. Create `components/workstation/JobQueue.tsx`
   - List of jobs
   - Job status display
   - Filtering options

2. Create `components/workstation/JobCard.tsx`
   - Individual job card
   - Status badge
   - Progress indicator
   - Action buttons

3. Create `lib/hooks/useJobStatus.ts`
   - Poll job status
   - Auto-refresh logic

4. Create `stores/jobStore.ts`
   - Zustand store for job state

5. Update workstation page to show job queue

**Acceptance Criteria:**
- [ ] All jobs are displayed
- [ ] Job status is shown (queued, running, succeeded, failed)
- [ ] Progress is shown for running jobs
- [ ] Jobs auto-refresh every 2 seconds
- [ ] User can filter by status
- [ ] User can sort by date

---

### Day 4: Job Details & Status

**Goal**: Users can view detailed job information

#### Tasks:
1. Create `app/(workstation)/jobs/[id]/page.tsx`
   - Job details page
   - Full job information
   - Real-time status updates

2. Create `components/workstation/JobStatus.tsx`
   - Detailed status display
   - Progress bar
   - Error messages
   - Output preview

3. Enhance `useJobStatus.ts` hook
   - Real-time polling
   - WebSocket support (optional)

4. Add navigation from job queue to details

**Acceptance Criteria:**
- [ ] Job details page shows all information
- [ ] Status updates in real-time
- [ ] Progress bar shows current progress
- [ ] Error messages are displayed clearly
- [ ] Output files are listed when complete

---

### Day 5: Results & Downloads

**Goal**: Users can view and download results

#### Tasks:
1. Create `components/workstation/ResultsView.tsx`
   - Display job outputs
   - File list
   - Download buttons
   - Audio preview

2. Create `components/audio/AudioPlayer.tsx`
   - Simple audio player
   - Play/pause controls
   - Progress bar

3. Create `lib/api/audio.ts`
   - `downloadFile()` function
   - File download utilities

4. Integrate results view into job details page

**Acceptance Criteria:**
- [ ] Results are displayed when job completes
- [ ] User can download each output file
- [ ] User can preview audio files
- [ ] Download progress is shown
- [ ] File names are clear and descriptive

**✅ Phase 1 Complete**: Workstation interface fully functional.

---

## Phase 2: Chat Interface - Beta (4 days)

### Day 6: Chat UI Foundation

**Goal**: Basic chat interface structure

#### Tasks:
1. Create `app/(chat)/page.tsx`
   - Chat page layout
   - Basic structure

2. Create `components/chat/ChatInterface.tsx`
   - Main chat container
   - Layout structure

3. Create `components/chat/MessageList.tsx`
   - Message container
   - Scroll behavior
   - Auto-scroll to bottom

4. Create `components/chat/MessageBubble.tsx`
   - User message styling
   - Agent message styling
   - Timestamp display

5. Create `components/chat/MessageInput.tsx`
   - Input field
   - Send button
   - Enter key handling

**Acceptance Criteria:**
- [ ] Chat interface is displayed
- [ ] Messages are shown in list
- [ ] User can type messages
- [ ] Messages scroll to bottom
- [ ] Basic styling is applied

---

### Day 7: Chat API Integration

**Goal**: Connect chat to backend API

#### Tasks:
1. Create `lib/api/chat.ts`
   - `createSession()` function
   - `sendMessage()` function
   - `getHistory()` function
   - `uploadWithMessage()` function

2. Create `stores/chatStore.ts`
   - Session state
   - Messages state
   - Zustand store

3. Create `lib/hooks/useChat.ts`
   - Chat functionality hook
   - Message sending
   - History loading

4. Integrate API into chat components

**Acceptance Criteria:**
- [ ] Session is created on page load
- [ ] Messages are sent to API
- [ ] Agent responses are displayed
- [ ] Message history loads correctly
- [ ] Errors are handled gracefully

---

### Day 8: File Upload in Chat

**Goal**: Users can upload files in chat

#### Tasks:
1. Create `components/chat/FileUpload.tsx`
   - File upload button
   - File selection
   - Upload progress

2. Integrate file upload into chat interface
   - Add upload button to message input
   - Handle file upload with message
   - Show uploaded file info

3. Update `useChat.ts` hook
   - Handle file upload
   - Set primary audio for session

4. Test file upload functionality

**Acceptance Criteria:**
- [ ] User can upload files in chat
- [ ] File upload shows progress
- [ ] Uploaded file info is displayed
- [ ] File is set as primary audio
- [ ] Agent can reference uploaded audio

---

### Day 9: Enhanced Chat Features

**Goal**: Polish chat interface and add enhancements

#### Tasks:
1. Add typing indicators (if supported by backend)
2. Add message timestamps
3. Add agent tool call indicators (optional)
4. Add job creation links from chat
5. Add navigation to workstation from chat
6. Improve error handling
7. Add loading states

**Acceptance Criteria:**
- [ ] Chat interface is polished
- [ ] All features work smoothly
- [ ] User experience is good
- [ ] Integration with workstation works

**✅ Phase 2 Complete**: Beta chat interface functional.

---

## Phase 3: Polish & Integration (2 days)

### Day 10: UI/UX Improvements

**Goal**: Improve overall user experience

#### Tasks:
1. Add loading states throughout app
2. Add error boundaries
3. Add toast notifications
4. Improve responsive design
5. Add dark mode (optional)
6. Improve accessibility
7. Add keyboard shortcuts

**Acceptance Criteria:**
- [ ] All loading states are clear
- [ ] Errors are handled gracefully
- [ ] App works on mobile devices
- [ ] Accessibility is improved

---

### Day 11: Feature Integration

**Goal**: Integrate workstation and chat features

#### Tasks:
1. Add navigation between workstation and chat
2. Share audio context between features
3. Add job links from chat to workstation
4. Ensure consistent styling
5. Test complete workflows

**Acceptance Criteria:**
- [ ] Navigation works smoothly
- [ ] Features are integrated
- [ ] User can move between workstation and chat
- [ ] Context is shared correctly

---

## Phase 4: Testing & Deployment (1 day)

### Day 12: Testing & Bug Fixes

**Goal**: Ensure everything works correctly

#### Tasks:
1. Test all workflows end-to-end
2. Fix any bugs found
3. Performance optimization
4. Code cleanup
5. Documentation

**Acceptance Criteria:**
- [ ] All features work correctly
- [ ] No critical bugs
- [ ] Performance is acceptable
- [ ] Code is clean and documented

---

## Daily Checklist Template

For each day of development:

### Morning (Planning)
- [ ] Review day's goals
- [ ] Check backend API is running
- [ ] Review relevant backend API endpoints
- [ ] Plan component structure

### Development
- [ ] Create components
- [ ] Write TypeScript types
- [ ] Integrate API
- [ ] Test functionality
- [ ] Fix bugs

### End of Day
- [ ] Test all changes
- [ ] Commit code
- [ ] Update progress
- [ ] Plan next day

---

## Testing Strategy

### Unit Tests (Future)
- Component tests with React Testing Library
- Hook tests
- Utility function tests

### Integration Tests (Future)
- API integration tests
- User flow tests

### Manual Testing Checklist

**Workstation:**
- [ ] Upload audio file
- [ ] Create stem separation job
- [ ] Create MIDI conversion job
- [ ] View job status
- [ ] Download results
- [ ] View job details

**Chat:**
- [ ] Create session
- [ ] Send message
- [ ] Upload file in chat
- [ ] Receive agent response
- [ ] View message history
- [ ] Navigate to workstation from chat

---

## Common Issues & Solutions

### Issue: CORS Errors
**Solution**: Ensure backend CORS is configured to allow `http://localhost:3000`

### Issue: API Connection Failed
**Solution**: Check backend is running on `http://localhost:8000`

### Issue: File Upload Fails
**Solution**: Check file size limits and format validation

### Issue: Job Status Not Updating
**Solution**: Check polling interval and API endpoint

---

## Progress Tracking

### Week 1: Foundation & Workstation
- [ ] Phase 0: Setup (Day 0)
- [ ] Phase 1: Workstation (Days 1-5)

### Week 2: Chat & Polish
- [ ] Phase 2: Chat (Days 6-9)
- [ ] Phase 3: Polish (Days 10-11)
- [ ] Phase 4: Testing (Day 12)

---

## Next Steps After Completion

1. **User Testing**: Get feedback from users
2. **Performance Optimization**: Optimize bundle size, loading times
3. **Advanced Features**: Add audio visualization, batch processing
4. **Deployment**: Deploy to production
5. **Monitoring**: Set up error tracking and analytics

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Zustand Docs](https://zustand-demo.pmnd.rs)
- [TanStack Query Docs](https://tanstack.com/query)

### Backend API Reference
- API runs on: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/api/docs`
- Endpoints: See `backend/app/api/endpoints/`

---

## Notes

- Start with simple implementations, iterate and improve
- Don't over-engineer - build what's needed now
- Test frequently as you build
- Keep components small and focused
- Use TypeScript strictly - it will catch errors early

---

**Ready to start? Begin with Phase 0: Project Setup!**
