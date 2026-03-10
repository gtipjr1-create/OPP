# OPP - Organized Persistent Plans

OPP is a mobile-first productivity app for running focused daily sessions with structured tasks, priorities, and schedule visibility.

Live app: https://opp-psi.vercel.app

---

## Overview

OPP is built around a deliberate capture -> prioritize -> execute loop.
The system emphasizes interaction correctness, stability under edge cases, and predictable mobile behavior.

---

## Core Product

- Session-based planning workflow (active session + archived logs)
- Task creation, inline editing, completion toggling, and deletion
- Drag-and-drop task reordering with persistence
- Session lock/unlock state handling
- Archived session browsing (collapse/expand controls)
- Session utilities (duplicate, export, schedule/archive toggles, profile entry)

---

## Active Session UI System

The Active Session screen uses a dedicated CSS module at:

- `src/features/tasks/components/ActiveSession.module.css`

This module is wired into:

- `src/features/tasks/components/TasksScreen.tsx`

### Dynamic stat pill states

The completion and weighted pills are dynamically styled from state:

- `0%` -> `stat-pill neutral`
- `1-99%` -> `stat-pill progress`
- `100%` -> `stat-pill done`

### Fonts for Active Session styling

The Google Fonts stylesheet is linked in:

- `src/app/layout.tsx`

Link used:

- `https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap`

---

## Task Semantics

- Structured priority model (`high`, `normal`, `low`)
- Tagged priority extraction
- Scheduled time/date parsing
- Canonical semantics pipeline with migration-safe fallbacks

---

## Schedule Rail

- Hour rail visualization
- Priority-based schedule dots
  - High -> red
  - Normal -> blue
  - Low -> gray
- Untagged tasks do not render schedule indicators

---

## Interaction and UX Standards

- Mobile-first task row design
- Swipe tray masking (no layered UI bleed-through)
- Handleless long-press drag reorder when unlocked
- Swipe and drag conflict guards
- Inline confirm-delete flow
- Keyboard support and focus-visible states
- ARIA labeling and touch-target sizing

---

## Reliability and Hardening

- Unit tests for parsing, scheduling, and semantic logic
- Integration tests for task workflow state behavior
- Playwright E2E smoke tests
- Global error boundary
- Centralized telemetry logging (server + client)
- Error event IDs surfaced in UI for debugging clarity

---

## Tech Stack

- Next.js (App Router)
- React 19
- Tailwind CSS v4
- Supabase (Postgres + Auth + RLS)
- DnD Kit
- Framer Motion
- Playwright
- TypeScript + ESLint

---

## Run Locally

1. Install dependencies

```bash
npm install
```

2. Configure environment

Create `.env.local` and set required Supabase keys.

3. Start development server

```bash
npm run dev
```

4. Build for production

```bash
npm run build
```

5. Run lint and tests

```bash
npm run lint
npm test
npm run test:e2e
```
