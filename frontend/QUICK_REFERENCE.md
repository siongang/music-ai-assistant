# Quick Reference Guide - AI Music Agent

Quick lookups for common tasks and patterns when building with Cursor.

---

## 🎯 Most Important Files

| File | Purpose | When to Use |
|------|---------|-------------|
| `START_HERE.md` | Getting started guide | **START HERE** - First time setup |
| `MVP_ROADMAP.md` | Streamlined MVP path | **Building MVP** - Focus on essentials |
| `DEVELOPMENT_PLAN.md` | Full 24-phase roadmap | Understanding complete feature set |
| `docs/CURSOR_PROMPTS.md` | Ready-to-use prompts | **Every time** you start a new phase |
| `FOLDER_STRUCTURE.md` | Where files go | When unsure where to create a file |
| `ARCHITECTURE_DIAGRAM.md` | Visual architecture | Understanding how pieces fit |
| `docs/API_INTEGRATION.md` | Backend integration | Working with API calls |

---

## 🚀 Common Cursor Prompts

### Starting a New Phase

```
I'm building Phase [X]: [Feature Name].

Context:
- We've completed phases 1-[X-1]
- Existing code: [list relevant files]
- We're using [relevant tech/library]

Task:
[Paste the specific prompt from CURSOR_PROMPTS.md]

Requirements:
[Any specific requirements or constraints]

Location: src/features/[feature-name]/components/[FileName].tsx

Please create the component following our architecture patterns.
```

### Fixing an Error

```
I'm getting this error:

[Paste exact error message]

The error is in: [filename]

Context:
- I'm working on Phase [X]
- This component is supposed to [purpose]
- Related files: [list]

Please:
1. Identify the root cause
2. Fix the error
3. Explain what was wrong
```

### Adding a Feature

```
I want to add [feature] to the existing [component].

Current state:
- [Component] exists in [location]
- It currently does [current behavior]

Desired behavior:
- [What you want to add]
- [How it should work]

Requirements:
- Don't break existing functionality
- Follow our design system (cyan accent, dark theme)
- Keep it type-safe (TypeScript)

Please update the component.
```

### Refactoring

```
The [component/hook/function] in [location] is getting complex.

Current issues:
- [Issue 1]
- [Issue 2]

Please refactor it to:
- [Goal 1]
- [Goal 2]

Keep:
- Same public API (same props/exports)
- Same behavior
- Better organization

Show me the refactored code.
```

---

## 📁 File Location Lookup

**Q: Where do I put a component for [feature]?**

| Feature | Location |
|---------|----------|
| Object tree UI | `src/features/object-tree/components/` |
| Tool UI (menus, dialogs) | `src/features/tools/components/` |
| Track/timeline UI | `src/features/tracks/components/` |
| Waveform rendering | `src/features/views/waveform/` |
| MIDI rendering | `src/features/views/midi/` |
| Sheet music rendering | `src/features/views/sheet/` |
| Playback controls | `src/features/transport/components/` |
| Project management | `src/features/projects/components/` |
| Generic UI (Button, Card) | `src/components/ui/` |
| Layout components | `src/components/layout/` |

**Q: Where do I put a hook?**
- Feature-specific hook → `src/features/[feature]/hooks/`
- Generic utility hook → `src/lib/hooks/`

**Q: Where do I put API calls?**
- Endpoint functions → `src/api-client/endpoints/`
- Base client logic → `src/api-client/client.ts`

**Q: Where do I put types?**
- Core domain types (MusicalObject, Project) → `src/types/`
- API types (DTOs) → `src/api-client/types.ts`
- Feature-specific types → `src/features/[feature]/types/`

---

## 🎨 Design System Quick Reference

### Colors

```typescript
// Tailwind classes
bg-zinc-950     // Background (#0A0A0A)
bg-zinc-900     // Surface (#1A1A1A)
text-cyan-400   // Accent text (#00E5FF)
bg-cyan-500     // Accent background
text-white      // Primary text
text-zinc-400   // Muted text
```

### Common Patterns

```tsx
// Primary button
<Button variant="primary" className="bg-cyan-500 hover:bg-cyan-600">
  Action
</Button>

// Secondary button
<Button variant="secondary" className="border-cyan-400 text-cyan-400">
  Action
</Button>

// Card
<Card className="bg-zinc-900 hover:bg-zinc-800 transition-colors">
  Content
</Card>

// Input
<Input 
  className="bg-zinc-900 border-zinc-700 focus:border-cyan-400" 
  placeholder="Type here..."
/>
```

### Spacing

```
p-2   = 8px padding
p-4   = 16px padding
p-6   = 24px padding
p-8   = 32px padding

gap-2 = 8px gap
gap-4 = 16px gap
```

---

## 🔧 Common Code Patterns

### Zustand Store

```typescript
// Define store
interface ObjectTreeStore {
  objects: Record<string, MusicalObject>
  addObject: (object: MusicalObject) => void
}

export const useObjectTreeStore = create<ObjectTreeStore>((set) => ({
  objects: {},
  addObject: (object) => set((state) => ({
    objects: { ...state.objects, [object.id]: object }
  })),
}))

// Use store
const objects = useObjectTreeStore((state) => state.objects)
const addObject = useObjectTreeStore((state) => state.addObject)
```

### API Call

```typescript
// In api-client/endpoints/
export async function uploadAudio(
  file: File,
  projectId: string
): Promise<AudioUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('project_id', projectId)
  
  const response = await fetch(`${API_BASE_URL}/api/audio/upload`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) throw new ApiError(response.status, await response.text())
  return response.json()
}

// Usage in component
const handleUpload = async (file: File) => {
  try {
    const result = await uploadAudio(file, projectId)
    toast.success('Uploaded!')
  } catch (error) {
    toast.error('Upload failed')
  }
}
```

### Adapter

```typescript
// In adapters/
export function jobToMusicalObject(job: JobDTO): MusicalObject {
  return {
    id: job.input_audio_id,
    name: job.result?.filename || 'Unnamed',
    type: ObjectType.Audio,
    parentId: null,
    children: job.result?.artifacts.map(artifactToObject) || [],
    metadata: {},
    createdAt: new Date(job.created_at),
    updatedAt: new Date(job.updated_at),
  }
}
```

### Component with Hook

```typescript
// Hook
export function useObjectTree() {
  const objects = useObjectTreeStore((state) => state.objects)
  const addObject = useObjectTreeStore((state) => state.addObject)
  
  return {
    objects: Object.values(objects),
    addObject,
  }
}

// Component
export function ObjectPanel() {
  const { objects, addObject } = useObjectTree()
  
  return (
    <div>
      {objects.map(obj => (
        <ObjectTreeNode key={obj.id} object={obj} />
      ))}
    </div>
  )
}
```

---

## 🐛 Debugging Checklist

### Component Not Rendering

- [ ] Imported in parent component?
- [ ] Exported from file?
- [ ] Props passed correctly?
- [ ] No TypeScript errors?
- [ ] Check console for errors
- [ ] Check React DevTools component tree

### API Call Failing

- [ ] Backend server running? (`http://localhost:8000`)
- [ ] Correct endpoint URL?
- [ ] CORS configured in backend?
- [ ] Request body correct format?
- [ ] Check Network tab in DevTools
- [ ] Check backend logs

### State Not Updating

- [ ] Using Zustand actions (not mutating)?
- [ ] Component subscribed to correct state?
- [ ] Selector function correct?
- [ ] State update actually called?
- [ ] Check React DevTools state

### Canvas Not Rendering

- [ ] Canvas ref attached correctly?
- [ ] Width/height set?
- [ ] Drawing in `useEffect` with correct deps?
- [ ] Context 2D obtained?
- [ ] Canvas in DOM? (check Elements tab)

---

## 📦 Common Dependencies

### Already Installed

```json
{
  "next": "15.x",
  "react": "19.x",
  "typescript": "5.x",
  "tailwindcss": "3.x"
}
```

### Will Install During Phases

```bash
# Phase 4: State management
npm install zustand

# Phase 6: UI utilities
npm install clsx tailwind-merge
npm install lucide-react  # Icons

# Phase 14: Sheet music
npm install vexflow

# Phase 16: Context menu
npm install @radix-ui/react-dropdown-menu

# Phase 17: Toast notifications
npm install sonner

# Phase 21: Command palette
npm install cmdk

# Phase 24: Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

---

## 🎯 Phase Checklist Template

Copy this for each phase:

```markdown
## Phase [X]: [Name]

### Before Starting
- [ ] Read phase description in DEVELOPMENT_PLAN.md (or MVP_ROADMAP.md for MVP)
- [ ] Copy prompt from CURSOR_PROMPTS.md (or MVP_ROADMAP.md for modified prompts)
- [ ] Check that previous phase is complete

### During Development
- [ ] Paste prompt into Cursor
- [ ] Review generated code
- [ ] Check TypeScript errors
- [ ] Run `npm run dev`
- [ ] Test feature in browser
- [ ] Fix any issues

### After Completion
- [ ] All TypeScript errors resolved
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Code follows architecture
- [ ] Commit: `git commit -m "Phase [X]: [Name]"`

### Next Steps
- [ ] For MVP: Check MVP_ROADMAP.md for next phase
- [ ] For full feature set: Move to Phase [X+1]
```

---

## 🔥 Hot Tips

### 1. Always Provide Context to Cursor
```
"We're in Phase 7. We already have the design system (src/components/ui)
and the studio layout (app/(studio)/layout.tsx). Now create..."
```

### 2. Reference Existing Files
```
"Use the Button component from src/components/ui/button.tsx
and the theme colors from src/lib/theme.ts"
```

### 3. Iterate, Don't Restart
If Cursor's output isn't perfect:
```
"The component works but the styling is off. Update it to use
bg-zinc-900 instead of bg-gray-800 and add hover effects."
```

### 4. Ask for Explanations
```
"Explain why this hook uses useCallback here. Is it necessary?"
```

### 5. Test Incrementally
Don't build 5 components then test. Build 1, test, build next.

---

## 📞 Getting Unstuck

### Scenario 1: "I don't know where this file goes"
→ Check `FOLDER_STRUCTURE.md` section for that feature

### Scenario 2: "Phase prompt didn't work"
→ Provide more context about existing code
→ Reference specific files that already exist
→ Break it into smaller steps

### Scenario 3: "Component has errors"
→ Copy full error into Cursor
→ Ask to fix specific error
→ Check imports and exports

### Scenario 4: "Not sure if phase is complete"
→ Check "Acceptance Criteria" in DEVELOPMENT_PLAN.md
→ Test each criterion manually
→ If all pass, move on

### Scenario 5: "Want to add custom feature"
→ Finish core 24 phases first
→ Then follow the same pattern:
  1. Plan the feature (types, components, hooks)
  2. Create folder structure
  3. Write Cursor prompt
  4. Build and test

---

## 🎨 Example: Full Feature Build

Let's say you want to add a "Volume Meter" to tracks:

### 1. Plan
- **Type:** Add to TrackController
- **Location:** `src/features/tracks/components/VolumeMeter.tsx`
- **Data:** Need audio level from playback engine

### 2. Cursor Prompt
```
I want to add a volume meter to the TrackController component.

Context:
- TrackController exists in src/features/tracks/components/TrackController.tsx
- Playback engine is in src/features/playback/audio-engine.ts
- Design system uses cyan accent color

Requirements:
1. Create VolumeMeter component in src/features/tracks/components/
2. Show vertical bar that fills based on audio level (0-100)
3. Use cyan color (#00E5FF) for active portion
4. Update every frame during playback
5. Add to TrackHeader component

Please:
1. Create the VolumeMeter component
2. Add hook to get audio level from playback engine
3. Update TrackHeader to include meter
```

### 3. Build
Cursor generates the files.

### 4. Test
- Start playback
- See meter move
- Check performance (no lag)

### 5. Iterate
If not perfect:
```
"The meter is too small. Make it 80px tall and 12px wide.
Also add a subtle background to make it more visible."
```

### 6. Done!
Commit and move on.

---

## 📚 Command Cheat Sheet

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript

# Setup
./setup-structure.sh     # Create folder structure
chmod +x [script]        # Make script executable

# Git
git add .
git commit -m "Phase X: Feature"
git status
git diff

# Backend (for testing)
cd ../backend
python -m app.main                              # Start backend API
celery -A app.celery_app worker --loglevel=info # Start worker
```

---

## 🎯 Success Metrics

You'll know you're on track when:

✅ TypeScript shows no errors
✅ `npm run dev` starts without warnings
✅ UI matches the wireframes (roughly)
✅ Clicking buttons triggers expected actions
✅ API calls work (check Network tab)
✅ State updates reflect in UI immediately
✅ No console errors
✅ You can explain how each piece connects

---

## 🚀 Final Reminder

**This is a marathon, not a sprint.**

- 24 phases × ~1-2 hours each = 35-40 hours total
- That's **normal** for a project of this scope
- Cursor speeds up coding, but you still need to:
  - Understand the architecture
  - Test thoroughly
  - Make design decisions
  - Debug issues

**Trust the process:**
1. Read the plan
2. Follow the phases
3. Test incrementally
4. Commit often
5. Keep going

You've got comprehensive docs, ready-to-use prompts, and a clear architecture.

**Now go build something awesome.** 🎵🚀
