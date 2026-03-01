# OPP - Organized Persistent Plans

OPP is a productivity and planning app for running focused daily sessions with structured tasks, priorities, and schedule visibility.

Live app: https://opp-psi.vercel.app

## What's Implemented So Far

### Core Product
- Session-based planning workflow (active session + archived logs)
- Task creation, editing, completion toggling, deletion
- Drag-and-drop task reorder with persistence
- Session lock/unlock behavior
- Archived session browsing with collapse/expand controls

### Task Semantics
- Structured priority model (`high`, `normal`, `low`)
- Tagged priority extraction support
- Scheduled time/date parsing
- Canonical semantics pipeline + migration-safe fallbacks

### Schedule Rail
- Hour rail with priority-based dots
- Dot colors by explicit tagged priority:
  - High = red
  - Normal = blue
  - Low = gray
- Untagged tasks do not render schedule dots

### UX and Accessibility
- Inline task editing
- Confirm-delete flow with exclusive render path (no layered UI bleed-through)
- Improved mobile overflow handling for task rows
- Focus-visible states, keyboard interaction improvements, ARIA labels, touch targets

### Design System
- Tailwind v4 token-based styling (`@theme` in globals)
- OPP typography roles and color token usage
- Shared UI primitives (`Button`, `Card`, `Input`, `SectionHeader`, `InlineNotice`, `LoadingMark`)
- OppMark brand component and loading-state usage

### Reliability and Hardening
- Unit tests for core pure logic (parsing, scheduling, semantics)
- Integration tests for task workflow state behavior
- Playwright E2E smoke tests
- Visual task-row checks (desktop + mobile)
- Global error boundary
- Centralized server/client telemetry logging
- Error event IDs surfaced in UI notices for faster debugging

### Delivery Process
- CI workflow on PR/push:
  - `npm run lint`
  - `npm test`
  - `npm run test:e2e`
- PR template + release checklist + definition-of-done
- Task row state matrix checklist
- Weekly cleanup ritual docs

## Tech Stack
- Next.js (App Router)
- React 19
- Tailwind CSS v4
- Supabase (Postgres + Auth + RLS)
- DnD Kit
- Framer Motion
- Playwright
- ESLint + TypeScript

## Project Scripts

```bash
npm run dev
npm run build
npm run start

npm run lint
npm run test

npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables (Supabase/Auth as needed).
3. Start app:

```bash
npm run dev
```

## Key Docs
- `docs/typography.md`
- `docs/ui-standards.md`
- `docs/release-checklist.md`
- `docs/definition-of-done.md`
- `docs/task-row-state-matrix.md`
- `docs/weekly-cleanup.md`

## Notes
- OPP is actively evolving through phased quality milestones (testing, accessibility, reliability, and release process hardening).
- The app is currently optimized around the `tasks` feature set and session workflow.
