# OPP — Organized Persistent Plans

OPP is a mobile-first productivity app for running focused daily sessions with structured tasks, priorities, and schedule visibility.

Live app: https://opp-psi.vercel.app

---

## Overview

OPP is designed around a deliberate capture → prioritize → execute loop.  
The system emphasizes interaction correctness, stability under edge cases, and predictable mobile behavior.

---

## Core Product

- Session-based planning workflow (active session + archived logs)
- Task creation, inline editing, completion toggling, deletion
- Drag-and-drop task reordering with persistence
- Session lock/unlock state handling
- Archived session browsing (collapse/expand controls)

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
  - High → red
  - Normal → blue
  - Low → gray
- Untagged tasks do not render schedule indicators

---

## Interaction & UX Standards

- Mobile-first task row design
- Swipe tray masking (no layered UI bleed-through)
- Drag handle isolation (gesture conflict prevention)
- Inline confirm-delete flow
- Keyboard support + focus-visible states
- ARIA labeling and touch-target sizing

---

## Reliability & Hardening

- Unit tests for parsing, scheduling, and semantic logic
- Integration tests for task workflow state behavior
- Playwright E2E smoke tests
- Visual regression checks (desktop + mobile task row)
- Global error boundary
- Centralized telemetry logging (server + client)
- Error event IDs surfaced in UI for debugging clarity

---

## Delivery Process

- CI workflow on PR/push:
  - `npm run lint`
  - `npm test`
  - `npm run test:e2e`
- PR template
- Release checklist
- Definition-of-done documentation
- Task row state matrix validation
- Weekly cleanup ritual

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

### 1. Install dependencies

```bash
npm install