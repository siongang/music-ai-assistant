# Design System - Music Assistant

**Version**: 1.0  
**Last Updated**: 2026-01-29

## Design Principles

### 1. **Pure Black Foundation**
- Background: `bg-black` (pure #000000)
- Creates sleek, professional appearance
- Better contrast for UI elements
- Inspired by BandLab and Moises

### 2. **Minimal Borders**
- Only essential dividers
- Use `border-zinc-900` for subtle separation
- Prefer transparency: `border-zinc-800/50`
- Avoid visual clutter

### 3. **Tailwind Spacing Scale**
- Use defined spacing: `gap-1`, `gap-2`, `p-2`, etc.
- **Never use magic numbers or arbitrary values**
- Standard scale: 0.25rem increments (1 = 0.25rem, 2 = 0.5rem, 4 = 1rem)

### 4. **Typography Scale**
- Use semantic sizes: `text-xs`, `text-sm`, `text-base`
- Fixed sizes only when necessary: `text-[10px]` for compact UI
- Consistent font weights: `font-medium` for emphasis, `font-semibold` for headers

---

## Component Standards

### Header (Unified Branding + Transport)

**Structure:**
- Two rows in single `<header>` element
- Row 1: `h-9` (36px) - Branding + Project Name
- Row 2: `h-8` (32px) - Transport Controls
- Total: 17px (68px) compact header
- Single `border-b` at bottom only

**Colors:**
- Background: `bg-black`
- Text: `text-zinc-200` (primary), `text-zinc-500` (secondary)
- Borders: `border-zinc-800/50` (subtle)

**Spacing:**
- Horizontal padding: `px-4` (1rem)
- Gaps between items: `gap-1` to `gap-2` (tight)
- Zero padding between rows (tight vertical stack)

### Object Panel (Collapsible)

**Dimensions:**
- Open: `w-56` (224px / 14rem)
- Closed: `w-8` (32px / 2rem) - toggle button only
- Border: `border-r border-zinc-900`

**Features:**
- Toggle button with chevron icon
- "Add Object" button with dashed border
- Empty state with icon + text
- Minimal internal spacing

**State Management:**
- Use `useState` for toggle
- Client component: `"use client"` directive

### Main Workspace

**Background:**
- Pure black: `bg-black`
- No additional borders
- Full height: `flex-1`

---

## Color Palette

### Grayscale (Primary)
```css
black         - #000000  - Main background
zinc-950      - #09090b  - Elevated surfaces
zinc-900      - #18181b  - Borders, dividers
zinc-800      - #27272a  - Subtle borders
zinc-700      - #3f3f46  - Inactive elements
zinc-600      - #52525b  - Placeholder text
zinc-500      - #71717a  - Secondary text
zinc-400      - #a1a1aa  - Tertiary text
zinc-300      - #d4d4d8  - Primary text
zinc-200      - #e4e4e7  - High contrast text
zinc-100      - #f4f4f5  - White text
```

### Accent Colors
```css
cyan-500      - #06b6d4  - Primary accent (buttons, highlights)
cyan-400      - #22d3ee  - Hover states
blue-600      - #2563eb  - Gradient end
blue-500      - #3b82f6  - Secondary accent
```

### Usage Guidelines
- **Text**: Use `zinc-200` for primary, `zinc-500` for secondary
- **Backgrounds**: Pure `black` for main, `zinc-950` for cards
- **Borders**: `zinc-900` for visible, `zinc-800/50` for subtle
- **Interactive**: `hover:bg-zinc-900` for hover states
- **Accents**: `cyan-500` for CTAs and active states

---

## Interactive States

### Buttons

**Default:**
```tsx
className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-300"
```

**Primary (CTA):**
```tsx
className="rounded bg-gradient-to-r from-cyan-500 to-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white transition-all hover:from-cyan-400 hover:to-blue-500"
```

**Icon Button:**
```tsx
className="rounded p-1 text-zinc-600 transition-colors hover:text-zinc-400"
```

### Transitions
- Always use `transition-colors` or `transition-all`
- Duration: default (150ms) is appropriate
- Easing: default cubic-bezier is fine

---

## Icon Sizing

### Standard Sizes (Heroicons)
- Large: `h-5 w-5` or `h-4 w-4`
- Medium: `h-4 w-4` or `h-3.5 w-3.5`
- Small: `h-3 w-3`
- Compact: `h-3.5 w-3.5`

**Stroke Width:**
- Default: `strokeWidth={2}`
- Use `strokeWidth={1.5}` for thinner lines

---

## Accessibility

### ARIA Labels
- Always add `aria-label` to icon-only buttons
- Use `aria-hidden="true"` for decorative elements

### Semantic HTML
- `<header>` for app header
- `<aside>` for panels
- `<main>` for primary content
- `<button type="button">` to prevent form submission

---

## Layout Patterns

### Flexbox (Default)
```tsx
<div className="flex items-center gap-2">
```

### Centered Content
```tsx
<div className="absolute left-1/2 -translate-x-1/2">
```

### Full Height
```tsx
<div className="flex h-screen flex-col">
```

### Scrollable Area
```tsx
<div className="flex-1 overflow-auto">
```

---

## Best Practices

### ✅ DO
- Use Tailwind's spacing scale (gap-1, p-2, etc.)
- Use semantic HTML elements
- Add aria-labels for accessibility
- Use `transition-colors` for smooth interactions
- Keep borders minimal and subtle

### ❌ DON'T
- Use arbitrary values like `w-[234px]` (use `w-56` instead)
- Add unnecessary borders everywhere
- Use bright colors for borders
- Forget `type="button"` on buttons
- Use magic numbers

---

## Component Checklist

When creating new components:

- [ ] Uses pure `bg-black` background
- [ ] Follows Tailwind spacing scale (no arbitrary values)
- [ ] Minimal borders (`border-zinc-900` or lighter)
- [ ] Proper semantic HTML
- [ ] Accessible (aria-labels, button types)
- [ ] Smooth transitions on interactive elements
- [ ] Consistent icon sizing
- [ ] Color palette follows guidelines

---

## References

- **Inspiration**: BandLab, Moises
- **Framework**: Next.js 16, React 19, Tailwind CSS 4
- **Phase**: 4 (Object Tree State Management)
- **Documentation**: See `DEVELOPMENT_PLAN.md` for architecture
