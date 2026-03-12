# Frontend Quick Start Guide

**Ready to start building?** Follow these steps to get your frontend up and running.

---

## Step 1: Initialize Next.js Project

```bash
cd /home/sion/code/music-assistant
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**When prompted:**
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **No**
- App Router: **Yes** (default)
- Import alias: **@/*** (default)

---

## Step 2: Install Dependencies

```bash
cd frontend

# Core dependencies
npm install zustand @tanstack/react-query axios react-dropzone react-hook-form zod date-fns lucide-react

# Development dependencies
npm install -D @types/node @types/react @types/react-dom eslint-config-prettier prettier
```

---

## Step 3: Set Up shadcn/ui

```bash
npx shadcn-ui@latest init
```

**Configuration:**
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

**Install initial components:**
```bash
npx shadcn-ui@latest add button input card dialog toast progress badge
```

---

## Step 4: Environment Variables

Create `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Step 5: Create Folder Structure

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

---

## Step 6: Test Setup

```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the Next.js welcome page.

---

## Next Steps

1. **Read the execution plan**: See `EXECUTION_PLAN.md` for detailed day-by-day tasks
2. **Review the setup plan**: See `FRONTEND_SETUP_PLAN.md` for architecture details
3. **Start Phase 1**: Begin building the workstation interface

---

## Quick Reference

### Start Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Code Quality
```bash
npm run lint      # ESLint
npm run format    # Prettier
npm run type-check # TypeScript
```

---

## Common Commands

### Create a new component
```bash
# Example: Create AudioUpload component
touch components/workstation/AudioUpload.tsx
```

### Create a new page
```bash
# Example: Create upload page
touch app/\(workstation\)/upload/page.tsx
```

### Add shadcn/ui component
```bash
npx shadcn-ui@latest add [component-name]
```

---

## Troubleshooting

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Module not found errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Check types
npm run type-check
```

---

## Need Help?

- **Setup questions**: See `FRONTEND_SETUP_PLAN.md`
- **Development tasks**: See `EXECUTION_PLAN.md`
- **Architecture**: See `FRONTEND_SETUP_PLAN.md` (Architecture section)
- **Backend API**: See `../backend/README.md`

---

**Ready to code?** Start with Phase 1: Workstation Interface! 🚀
