# MVP Roadmap - AI Music Agent Frontend

**Goal:** Get a working music workstation with waveforms and stem separation in ~20-25 hours.

---

## 🎯 What's in the MVP

### Core Features
✅ Upload audio files (.wav, .mp3)
✅ View audio as waveforms in tracks
✅ Object tree (VSCode-style file explorer)
✅ Stem separation tool (right-click → "Separate Stems")
✅ Stems appear as children in object tree
✅ Audio playback with waveform visualization
✅ Multi-track mixing (mute, solo, volume)
✅ Project management (create, open, list projects)

### What's NOT in MVP (Add Later)
🔲 MIDI view (piano roll)
🔲 Sheet music view
🔲 Audio-to-MIDI conversion tool
🔲 Key/chord analysis tools
🔲 Keyboard shortcuts
🔲 Marketing pages
🔲 Mobile/tablet optimization

---

## 📋 MVP Development Path

### **Part 1: Foundation** (8-10 hours)

#### Phase 1: Type System (30 min)
- Core TypeScript types
- Project, MusicalObject, Tool, View
- **Skip:** MIDI-specific types (add later)

#### Phase 2: API Client (1 hour)
- Base HTTP client
- Endpoints: audio, jobs
- **Skip:** Chat endpoint (optional)

#### Phase 3: Adapters (30 min)
- API DTO → App model transformations
- Focus on Audio and Job types

#### Phase 4: Object Tree State (1 hour)
- Zustand store for object tree
- Add, remove, update, select objects
- Hierarchical relationships

#### Phase 5: Layout Shell (1 hour)
- Route groups: (marketing) and (studio)
- Studio layout: AppBar + Transport + 2-column
- **Skip:** Marketing pages (add later)

#### Phase 6: Design System (1 hour)
- Base components: Button, Card, Input
- Theme colors (use YOUR colors, not Moises.ai)
- Tailwind utilities

#### Phase 7: AppBar (45 min)
- Top navigation bar
- Logo, project name, user menu

#### Phase 8: TransportBar (45 min)
- Play, pause, skip controls
- Time display
- **Skip:** Metronome, key signature (add later)

#### Phase 9: Object Panel (2 hours)
- VSCode-style tree view
- Collapsible nodes
- Right-click context menu (placeholder)

---

### **Part 2: Core Functionality** (6-8 hours)

#### Phase 10: Track Area (1 hour)
- Timeline ruler
- Track list container
- View mode switcher (only show Waveform tab for now)

#### Phase 11: Track Controller (1 hour)
- Track header with M/S/H buttons
- Volume slider
- Wrapper for renderers

#### Phase 12: Waveform Renderer (2 hours)
- Canvas-based waveform visualization
- Zoom and pan
- Performance optimizations
- **This is the ONLY view for MVP**

#### **SKIP Phase 13-14** (MIDI & Sheet Music)
Jump straight to Phase 15 after Phase 12.

#### Phase 15: Tool Registry (1 hour)
- Tool plugin system
- **Only implement:** Separate Stems tool
- **Skip:** Convert to MIDI, Analyze Key

#### Phase 16: Context Menu (1 hour)
- Right-click on object → show tools
- For MVP: only "Separate Stems" option

#### Phase 17: Tool Execution (2 hours)
- Execute stem separation
- Poll job status
- Show progress toast
- Add stem children to object tree

---

### **Part 3: Playback & Projects** (6-7 hours)

#### Phase 18: Audio Playback (2-3 hours)
- Web Audio API integration
- Multi-track playback
- Mute/solo/volume controls
- **Waveforms only** (no MIDI playback needed)

#### Phase 19: Project Management (1 hour)
- Home page with project list
- Create new project
- Navigate to project workspace

#### Phase 20: File Upload (1 hour)
- Drag & drop audio files
- File picker dialog
- Upload to backend
- Add to object tree

#### **SKIP Phase 21-24** (Shortcuts, Marketing, Polish)
You can add these after MVP is working.

---

## 🎬 MVP Demo Flow

After completing the MVP, you should be able to:

1. **Open app** → See project list
2. **Create project** → "My Song"
3. **Upload audio** → Drag song.wav into object tree
4. **View waveform** → See audio in track area
5. **Play audio** → Press play, hear sound, see playhead move
6. **Right-click object** → Select "Separate Stems"
7. **Wait for job** → See progress toast
8. **View stems** → 4 children appear (vocals, bass, drums, other)
9. **Play individual stem** → Mute others, solo one
10. **Multi-track playback** → Play all stems together

**Time to complete demo:** 2 minutes  
**Time to build MVP:** ~20-25 hours

---

## 🔧 Required Backend Endpoints

Make sure these work before starting frontend:

### Audio
- ✅ `POST /api/audio` - Upload audio file (multipart form; not `/api/audio/upload`)
- ✅ `GET /api/audio/{id}/download` - Download audio blob
- ✅ `GET /api/audio/files/{path}` - Download job outputs (stems, MIDI, etc.)

### Jobs
- ✅ `POST /api/jobs` - Create job (body: `{ type: "stem_separation", input: { audio_id: "..." }, params: {} }`)
  - Response: `{ job_id, status, ... }`
- ✅ `GET /api/jobs/{id}` - Get job status
  - Response: `{ job_id, status, type, output, progress, ... }`

### Projects (Optional for MVP)
- Can use localStorage for now
- Add backend persistence later

---

## 📝 Modified Cursor Prompts

### Phase 10: Track Area (Modified)

```
Phase 10: Create the track area structure.

Context:
- Right panel in studio layout (80% width)
- Shows timeline ruler and track list
- For MVP: ONLY waveform view (no MIDI/sheet tabs yet)

Task:
Create the track area shell.

1. src/features/tracks/components/TrackArea.tsx:
   - Container component
   - Top: Simple "Waveform View" label (no tabs yet)
   - Below: TimelineRuler (fixed at top)
   - Main: TrackList (scrollable)

2. src/features/tracks/components/TimelineRuler.tsx:
   [Same as original]

3. src/features/tracks/components/TrackList.tsx:
   [Same as original]

SKIP ViewModeSwitcher for now (only one view mode in MVP).
```

### Phase 15: Tool Registry (Modified)

```
Phase 15: Create the tool registry system.

Context:
- Tools are modular plugins
- Each tool has metadata and execute function
- For MVP: ONLY stem separation tool

Task:
Create registry and ONE tool.

1. src/features/tools/registry/tool-registry.ts:
   [Same as original]

2. src/features/tools/definitions/separate-stems-tool.ts:
   - Tool definition for stem separation
   - Metadata:
     - id: 'separate-stems'
     - name: 'Separate Stems'
     - icon: '🎛️'
     - inputTypes: [ObjectType.Audio]
     - outputType: ObjectType.Stems
   - execute function:
     - Call POST /api/jobs/separate_stems
     - Poll job status
     - Return new MusicalObject with stem children

3. Initialize registry:
   - Register separate-stems tool ONLY
   
SKIP convert-to-midi-tool (backend not ready).

Test: toolRegistry.getAllTools() should return 1 tool.
```

---

## 🚀 After MVP: Adding MIDI & Sheet Music

Once MVP is working and backend MIDI support is ready:

### 1. Add MIDI Renderer (Phase 13)
- Use original prompt from `CURSOR_PROMPTS.md`
- Install additional dependencies if needed
- Add MIDI view tab to ViewModeSwitcher

### 2. Add Sheet Music Renderer (Phase 14)
- Install VexFlow: `npm install vexflow`
- Use original prompt
- Add Sheet view tab

### 3. Add Convert to MIDI Tool
- Create `convert-to-midi-tool.ts`
- Register in tool registry
- Test on audio objects

### 4. Update Track Area
- Add ViewModeSwitcher with 3 tabs
- Switch between Waveform/MIDI/Sheet
- All use same TrackController

**Estimated time to add:** 6-8 hours

---

## 💡 Development Tips

### 1. Test Backend First
Before starting frontend work, verify:
```bash
curl -X POST http://localhost:8000/api/audio/upload \
  -F "file=@test.wav" \
  -F "project_id=test-project"

# Note the audio_id from response, then:
curl -X POST http://localhost:8000/api/jobs/separate_stems \
  -H "Content-Type: application/json" \
  -d '{"audio_id":"YOUR_AUDIO_ID"}'

# Poll the job:
curl http://localhost:8000/api/jobs/YOUR_JOB_ID
```

### 2. Start Simple
- Use sample audio files (short, < 1MB)
- Test locally before worrying about deployment
- Add features incrementally

### 3. Commit Often
```bash
git commit -m "Phase 1: Core types"
git commit -m "Phase 4: Object tree state"
git commit -m "Phase 12: Waveform renderer"
```

### 4. Visual Progress
After each phase, you should SEE something:
- Phase 9: Tree view with nodes
- Phase 12: Waveform rendering
- Phase 17: Stems appear after tool execution

### 5. Don't Block on Polish
- Colors can be tweaked later
- Animations can be added later
- Focus on functionality first

---

## ✅ MVP Completion Checklist

You've completed MVP when:

- [ ] Can create a new project
- [ ] Can upload audio files
- [ ] Object tree shows uploaded files
- [ ] Waveforms render in track area
- [ ] Can play audio and hear sound
- [ ] Right-click shows "Separate Stems" option
- [ ] Clicking tool triggers backend job
- [ ] Progress toast shows during processing
- [ ] Stem objects appear as children in tree
- [ ] Each stem has its own waveform
- [ ] Can mute/solo individual stems
- [ ] Can play multiple stems together
- [ ] No console errors during normal usage

---

## 🎯 Success Metrics

**MVP is successful when you can:**
- Record a 30-second demo video showing the full workflow
- Share it with a friend who can understand what the app does
- Identify 3-5 improvements to make next

**MVP is NOT:**
- Pixel-perfect design
- Fully responsive on mobile
- Complete feature parity with DAWs
- Ready for production users

**MVP IS:**
- Working proof of concept
- Foundation for future features
- Something you can demo and iterate on

---

## 📚 Next Steps After MVP

1. **Polish the MVP**
   - Improve error handling
   - Add loading states
   - Smooth animations
   - Better visual feedback

2. **Add MIDI Support**
   - Implement Phase 13-14
   - Add convert-to-midi tool
   - Test end-to-end workflow

3. **User Testing**
   - Share with musician friends
   - Collect feedback
   - Prioritize improvements

4. **Production Prep**
   - Add authentication
   - Deploy to Vercel
   - Add analytics
   - Write user docs

5. **Advanced Features**
   - Keyboard shortcuts
   - Command palette
   - Collaboration features
   - Mobile support

---

**Ready to start?** Run the setup script and begin with Phase 1! 🚀
