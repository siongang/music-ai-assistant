# 🎵 AI Music Agent Frontend - START HERE

Welcome! This guide will help you start building the frontend with Cursor.

---

## ⚡ Quick Start (5 minutes)

### Step 1: Setup the Folder Structure

```bash
cd frontend
chmod +x setup-structure.sh
./setup-structure.sh
```

This creates all the necessary folders following professional Next.js standards.

### Step 2: Read the Core Documents

You MUST read these before coding:

1. **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)** (15 min read)
   - Understand the 4 core primitives
   - Learn the mental model
   - Review the 24 development phases

2. **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** (10 min read)
   - See where each file should go
   - Understand the architectural layers
   - Learn import path conventions

### Step 3: Start Phase 1 with Cursor

Open `docs/CURSOR_PROMPTS.md` and copy the **Phase 1A** prompt.

Paste it into Cursor Composer.

Review the generated types, then test them.

---

## 🧠 Mental Model (Critical to Understand)

Your product is **NOT a DAW**. It's a **project-centric workspace** with 4 core primitives:

### 1. Project
- Owns everything: tempo, key, object tree
- One project = one workspace

### 2. MusicalObject
- Audio files (song.wav, bass.wav)
- MIDI files (bass.mid)
- Derived objects (stems, analysis)
- **Hierarchical tree structure**

### 3. Tool
- Transforms objects → new objects
- Examples: Separate Stems, Audio → MIDI
- **NOT separate pages; contextual actions**

### 4. View
- Waveform renderer
- MIDI renderer (piano roll)
- Sheet music renderer
- **Views don't own data; they only render**

### The Golden Rule
**Object tree = source of truth. Tracks = projections.**

---

## 📋 Your Development Roadmap

### 🚀 MVP Path (Do First - ~20-25 hours)

Complete these phases **in order** for a working waveform + stem separation app:

| Phase | What You'll Build | Cursor Prompt Location | Time Est. |
|-------|-------------------|------------------------|-----------|
| 1 | TypeScript types for the 4 primitives | CURSOR_PROMPTS.md → Phase 1A | 30 min |
| 2 | API client for backend integration | CURSOR_PROMPTS.md → Phase 2A-B | 1 hour |
| 3 | Adapters (API ↔ App models) | CURSOR_PROMPTS.md → Phase 3A | 30 min |
| 4 | Object tree state (Zustand) | CURSOR_PROMPTS.md → Phase 4A | 1 hour |
| 5 | Layout shell (studio only) | CURSOR_PROMPTS.md → Phase 5A | 1 hour |
| 6 | Design system (colors, Button, Card) | CURSOR_PROMPTS.md → Phase 6A | 1 hour |
| 7 | AppBar component | CURSOR_PROMPTS.md → Phase 7A | 45 min |
| 8 | TransportBar component | CURSOR_PROMPTS.md → Phase 8A | 45 min |
| 9 | Object Panel (tree view) | CURSOR_PROMPTS.md → Phase 9A | 2 hours |
| 10 | Track Area structure | CURSOR_PROMPTS.md → Phase 10A | 1 hour |
| 11 | Track Controller (M/S/H controls) | CURSOR_PROMPTS.md → Phase 11A | 1 hour |
| 12 | **Waveform Renderer** ✅ | CURSOR_PROMPTS.md → Phase 12A | 2 hours |
| ~~13~~ | ~~MIDI Renderer~~ ⏸️ **SKIP** | - | - |
| ~~14~~ | ~~Sheet Music Renderer~~ ⏸️ **SKIP** | - | - |
| 15 | Tool Registry (stem separation only) | MVP_ROADMAP.md | 1 hour |
| 16 | Context Menu (right-click tools) | CURSOR_PROMPTS.md → Phase 16A | 1 hour |
| 17 | Tool Execution & Job Tracking | CURSOR_PROMPTS.md → Phase 17A | 2 hours |
| 18 | Audio Playback Engine | CURSOR_PROMPTS.md → Phase 18A | 2-3 hours |
| 19 | Project Management (home page) | CURSOR_PROMPTS.md → Phase 19A | 1 hour |
| 20 | File Upload | CURSOR_PROMPTS.md → Phase 20A | 1 hour |

**MVP total time:** ~20-25 hours

### 🔮 Future Features (Add Later)

After MVP is working, add these when backend is ready:

| Phase | What You'll Build | When to Add |
|-------|-------------------|-------------|
| 13 | MIDI Renderer (piano roll) | When audio-to-MIDI backend is stable |
| 14 | Sheet Music Renderer | After Phase 13 |
| 15+ | Convert to MIDI tool | With Phase 13-14 |
| 21 | Keyboard Shortcuts | Polish phase |
| 22 | Marketing Pages | Pre-launch |
| 23 | Responsive Design | Polish phase |
| 24 | Testing & Polish | Pre-launch |

**See MVP_ROADMAP.md for detailed MVP-specific instructions.**

---

## 🎯 How to Use Cursor Effectively

### Rule #1: One Phase at a Time
Don't try to build multiple phases in one session. Finish Phase 1, test it, then move to Phase 2.

### Rule #2: Always Provide Context
When starting a phase, tell Cursor what already exists:

```
"We're building Phase 7: AppBar Component.

Context:
- Design system exists in src/components/ui; follow DESIGN_SYSTEM.md (bg-black, zinc borders, cyan accents)
- Studio layout in app/(studio)/layout.tsx

Now create the AppBar component with..."
```

### Rule #3: Reference Existing Code
```
"Use the Button component from src/components/ui/button.tsx
and follow DESIGN_SYSTEM.md for colors (bg-black, cyan accents)"
```

### Rule #4: Verify After Each Phase
After Cursor generates code:
1. Check for TypeScript errors
2. Run `npm run dev` and test in browser
3. Manually verify the feature works
4. Only then move to next phase

### Rule #5: Iterate on Errors
If something doesn't work:
```
"The component isn't rendering. Check that:
1. Imports are correct
2. Props are passed
3. No TypeScript errors
Fix any issues."
```

---

## 📁 Where Files Go (Quick Reference)

| File Type | Location |
|-----------|----------|
| Route pages | `app/(marketing)/` or `app/(studio)/` |
| Core types | `src/types/` |
| API calls | `src/api-client/endpoints/` |
| DTO adapters | `src/adapters/` |
| Feature components | `src/features/{feature-name}/components/` |
| Feature hooks | `src/features/{feature-name}/hooks/` |
| Shared UI components | `src/components/ui/` |
| Utils | `src/lib/` |

**Example:**
- Waveform renderer → `src/features/views/waveform/WaveformRenderer.tsx`
- Button component → `src/components/ui/button.tsx`
- Object tree hook → `src/features/object-tree/hooks/useObjectTree.ts`

---

## 🎨 Design System

**Use DESIGN_SYSTEM.md** for all UI styling. Current standard:

- **Background:** Pure black (`bg-black`, #000000) for main areas
- **Borders:** `border-zinc-900` or `border-zinc-800/50`
- **Accent:** Tailwind cyan (`cyan-500`, `cyan-400`); primary CTA gradient: `from-cyan-500 to-blue-600`
- **Text:** `text-white` / `text-zinc-400` for muted

Optional `src/lib/theme.ts` for JS color values; otherwise use Tailwind classes from DESIGN_SYSTEM.md.

---

## 🧪 Testing Your Progress

After each phase, manually test:

### Phase 1 (Types)
```typescript
// In a test file
import { MusicalObject, ObjectType } from '@/types/musical-object'

const obj: MusicalObject = {
  id: '1',
  name: 'test.wav',
  type: ObjectType.Audio,
  parentId: null,
  children: [],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
}

console.log(obj) // Should compile with no errors
```

### Phase 7 (AppBar)
1. Run `npm run dev`
2. Navigate to `/studio`
3. See the app bar at the top
4. Click hamburger menu → should log to console
5. Edit project name → should update

### Phase 12 (Waveform)
1. Add sample audio data to store
2. See waveform render in track area
3. Zoom in/out → waveform updates
4. No errors in console

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't: Put business logic in route files
```typescript
// ❌ BAD: app/(studio)/page.tsx
export default function StudioPage() {
  const [objects, setObjects] = useState([])
  // ... lots of logic
}
```

✅ **Do: Keep routes thin**
```typescript
// ✅ GOOD: app/(studio)/page.tsx
import { ObjectPanel } from '@/features/object-tree/components/ObjectPanel'

export default function StudioPage() {
  return <ObjectPanel />
}
```

### ❌ Don't: Create circular dependencies
```typescript
// ❌ BAD
// src/features/tools/hook.ts imports src/features/tracks/hook.ts
// src/features/tracks/hook.ts imports src/features/tools/hook.ts
```

✅ **Do: Use dependency injection or shared stores**

### ❌ Don't: Mutate Zustand state directly
```typescript
// ❌ BAD
const objects = useObjectTreeStore(state => state.objects)
objects['123'] = newObject  // Mutation!
```

✅ **Do: Use actions**
```typescript
// ✅ GOOD
const addObject = useObjectTreeStore(state => state.addObject)
addObject(newObject)
```

---

## 🔗 Backend Integration

The frontend talks to a FastAPI backend at `http://localhost:8000`.

**Before testing tools:**
1. Start backend: `cd backend && python -m app.main`
2. Start Celery worker: `cd backend && celery -A app.celery_app worker --loglevel=info`
3. Start frontend: `npm run dev`

See `docs/API_INTEGRATION.md` for detailed workflows.

---

## 📚 Additional Resources

- **Next.js App Router Docs:** https://nextjs.org/docs/app
- **Zustand Docs:** https://zustand-demo.pmnd.rs/
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **Web Audio API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **VexFlow (sheet music):** https://github.com/0xfe/vexflow

---

## 🎯 Your First Session (Next 2 Hours)

Here's what to do RIGHT NOW:

### Hour 1: Read & Setup
1. ⏱️ 5 min: Run `./setup-structure.sh`
2. ⏱️ 15 min: Read `DEVELOPMENT_PLAN.md`
3. ⏱️ 10 min: Read `FOLDER_STRUCTURE.md`
4. ⏱️ 10 min: Read this file (START_HERE.md)
5. ⏱️ 20 min: Browse `docs/CURSOR_PROMPTS.md` to see what's coming

### Hour 2: Build Phase 1
1. ⏱️ 5 min: Copy Phase 1A prompt from `docs/CURSOR_PROMPTS.md`
2. ⏱️ 10 min: Paste into Cursor, review generated types
3. ⏱️ 10 min: Create a test file to verify types work
4. ⏱️ 5 min: Copy Phase 1B prompt (if there is one)
5. ⏱️ 20 min: Complete Phase 1
6. ⏱️ 10 min: Commit your work: `git add . && git commit -m "Phase 1: Type system"`

### After 2 Hours
You'll have:
- ✅ Complete folder structure
- ✅ Core TypeScript types
- ✅ Confidence in the development process
- ✅ Ready to tackle Phase 2

---

## 💡 Pro Tips

1. **Keep Cursor conversations focused:** Don't try to build 5 features in one chat. One phase = one conversation.

2. **Use Git frequently:** Commit after each phase. This lets you rollback if something breaks.

3. **Test in the browser constantly:** Don't write 10 files then test. Write 1-2 files, test, repeat.

4. **Reference the wireframes:** Your uploaded wireframes show the target UI. Keep them visible.

5. **Don't over-engineer early:** Start simple. Refactor later when you understand the patterns.

6. **Ask Cursor to explain:** If generated code is confusing, ask "Explain what this hook does and why it's structured this way."

---

## ❓ FAQ

**Q: Can I skip phases?**
A: No. Each phase builds on previous work. Skipping breaks the architecture.

**Q: What if I disagree with a design decision?**
A: Adjust the prompts in `docs/CURSOR_PROMPTS.md` before using them. The architecture is flexible.

**Q: How long will this take?**
A: 35-40 hours of focused development. Expect 2-3 weeks if working part-time.

**Q: Can I add features not in the plan?**
A: Yes, but finish the core 24 phases first. Then extend using the same modular pattern.

**Q: What if Cursor generates buggy code?**
A: Iterate. Ask Cursor to fix specific issues. Reference TypeScript errors. Test incrementally.

---

## 🚀 Ready? Let's Go!

1. ✅ Run `./setup-structure.sh`
2. ✅ Read `DEVELOPMENT_PLAN.md` (15 min)
3. ✅ Copy Phase 1A prompt from `docs/CURSOR_PROMPTS.md`
4. ✅ Paste into Cursor Composer
5. ✅ Build Phase 1!

**You got this.** The architecture is solid. The plan is clear. Cursor will help with the tedious parts. You focus on the creative decisions.

Happy building! 🎵🚀
