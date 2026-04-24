# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack
- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Animation:** Framer Motion (`useScroll`, `useTransform`, `useAnimationFrame`)
- **Backend:** Supabase (PostgreSQL + Auth) — not yet wired up
- **Font:** Geist / Geist Mono via `next/font/google`

## Common Commands
```bash
npm run dev    # Start dev server (localhost:3000)
npm run build  # Production build
npm run lint   # ESLint

# Frame extraction (requires ffmpeg, run from project root)
bash tools/extract-frames.sh
```

## Skill Invocation Rules
- **ALWAYS** invoke the `front-end-design` skill before writing any UI code
- **ALWAYS** invoke the `video-to-website` skill for any 3D / scrollytelling components

## Architecture

### Scrollytelling Pattern
The site uses a **sticky-viewport scroll sequence**:
- A `500vh` scroll track div wraps a `position: sticky; height: 100vh` inner div
- Scroll progress (`0→1`) drives canvas frame index and overlay opacity
- **Two implementations exist in parallel** — pick one and delete the other:
  1. `src/app/page.tsx` — self-contained, uses raw `window.scrollY` + `requestAnimationFrame`; frames are `.jpg` at `/assets/frame_NNNN.jpg`; 169 frames
  2. `src/components/hero/` — component-split version using Framer Motion's `useScroll`; frames are `.webp` at `/assets/frame_NNNN.webp`; 120 frames

### Component Layer Stack (`src/components/hero/`)
| Layer | Component | z-index | Role |
|-------|-----------|---------|------|
| -1 | `FrameCanvas` | −1 | LERP canvas frame playback (Framer Motion `useAnimationFrame`) |
| 1 | `StudioLighting` (inline in `ScrollytellingHero`) | 1 | Two 1200px radial blur orbs |
| 5 | `TerminalOverlay` | 5 | Glassmorphic terminal cards keyed to scroll anchors |

### Frame Playback (`FrameCanvas.tsx`)
- Preloads all frames with `Promise.all` on mount
- `useTransform(scrollYProgress, [0,1], [0, TOTAL_FRAMES-1])` → target frame
- LERP factor `0.1` smooths playback each animation frame
- `TOTAL_FRAMES` constant must match actual extracted frame count

### Scroll Anchors (`TerminalOverlay.tsx`)
Three terminal cards keyed to scroll ranges:
- Card 1: `0–24%` — left side (`left: 120px`)
- Card 2: `36–64%` — right side (`right: 120px`)
- Card 3: `76–100%` — center bottom

### Node.js / localStorage Shim (`src/instrumentation.ts`)
Node.js 22+ exposes a broken `localStorage` global stub that crashes Framer Motion at SSR module-load time. The instrumentation hook replaces it with an in-memory shim before any app module evaluates. This must stay in place when running Next.js 15+ on Node 22+.

## Design System (`src/app/globals.css`)
- **Background:** `#000000` (`--layer-0`)
- **Grid:** 16-column, `--grid-margin: 120px`, `--grid-gutter: 24px`, max-width 1680px; collapses to 4-col on mobile
- **Accent:** `#4DA8DA` (cyan) / `#06B6D4` (teal)
- **Glass surface:** `rgba(255,255,255,0.02)` bg + `blur(20px)` + `rgba(255,255,255,0.15)` border
- **Corner radii:** 80px sections, 50px buttons, 24px cards
- **Depth blurs:** `--light-size: 1200px` radial blurs at `--light-opacity: 0.07`
- **Easing:** `--ease-obsidian: cubic-bezier(0.16, 1, 0.3, 1)`
- **Key classes:** `.text-gradient-cyan`, `.tech-grid-bg`, `.cursor-blink`, `.grid-16`
- Scrollbar hidden globally for cinematic scroll

## Assets
- `public/assets/hero-video.mp4` — source video for frame extraction
- `public/assets/site-target.png` — visual design target / reference screenshot
- Frame images land at `public/assets/frame_NNNN.{jpg|webp}` after running `extract-frames.sh`
- Frame images are gitignored (`.env` rule catches them — verify `.gitignore` if frames need committing)

## Project Structure
```
/src/app/           — Root layout, globals.css, page.tsx (self-contained scrollytelling)
/src/components/    — Reusable component splits (hero/)
/src/instrumentation.ts — Node.js localStorage shim for Next.js SSR
/public/assets/     — Video source, design target PNG, extracted frames
/tools/             — Shell scripts (extract-frames.sh)
/workflows/         — Project SOPs (currently empty)
```
