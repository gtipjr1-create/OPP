# OPP — Build Plan

OPP is actively evolving through phased quality milestones.
Primary standard: smooth, fast, responsive, clean.
Feature growth only when stability is proven in daily use.

---

## Phase 0 — Baseline Stability (now)
**Goal:** keep core loop rock solid (auth + tasks).

- ✅ Supabase SSR auth stable (Next 16 proxy + cookies adapter)
- ✅ Mobile swipe tray stabilized (no overlay, controlled swipe)

Exit criteria:
- production build is green
- login persists across refresh
- mobile task list feels predictable

---

## Phase 1 — Mobile “One Screen” Layout (Option A)
**Goal:** Work Stack becomes first-class on mobile with minimal scroll.

Changes:
- On `<md`:
  - slim header (title + lock + status)
  - **MiniStatsRow** replaces full StatsCards
  - Work Stack appears before schedule/archive
  - schedule + archive collapsed by default
- On `md+`: keep current grid layout unchanged

Exit criteria:
- iPhone: Work Stack visible with minimal scroll
- no loss of clarity for session status

---

## Phase 2 — Reorder Reliability
**Goal:** drag is dependable and never conflicts with swipe.

Changes:
- Drag starts only from handle
- Swipe must not capture touches that begin on the drag handle
- If drag active → swipe disabled (already partially true)

Exit criteria:
- iPhone: handle drag always works
- swipe still works from the row body
- no “dead zones” or accidental gestures

---

## Phase 3 — Keyboard + Focus Polish
**Goal:** fast task entry across desktop + mobile.

Changes:
- Desktop: Enter submits “Add task”
- Mobile: after submit, focus behavior is intentional (no surprise keyboard pop)
- Keep error reset + clear feedback when blocked

Exit criteria:
- can add 5 tasks quickly without friction

---

## Phase 4 — Latency Masking + Reliability UX
**Goal:** UI feels instant, errors are readable.

Changes:
- Optimistic toggle done (instant checkbox + strike-through)
- Optimistic reorder hardening (UI updates immediately, rollback on failure)
- Inline errors with short event IDs (E-TS-XXXX)

Exit criteria:
- most actions feel immediate even on slow network
- errors are actionable, not vague

---

## Phase 5 — Settings Entry Point (Cog) + Action Consolidation
**Goal:** remove header clutter and create a home for future actions.

Changes:
- Add Settings cog dropdown:
  - Duplicate session
  - Export
  - Settings
  - Profile (placeholder)
- Keep New Session as primary CTA

Exit criteria:
- header is cleaner
- future actions have a stable home

---

## Phase 6 — Profile Basics (when needed)
**Goal:** minimal account identity without scope creep.

Changes:
- `/settings/profile` page
- `profiles` table (user_id, display_name, avatar_url)
- optional avatar upload (Supabase storage)

Exit criteria:
- user can set a name + avatar
- no multi-profile switching yet

---

## Phase 7 — PWA Install Polish (lightweight)
**Goal:** home-screen install feels native.

Changes:
- manifest + icons (done)
- verify iOS apple-touch-icon
- verify standalone display mode

Exit criteria:
- iPhone “Add to Home Screen” shows correct icon
- launches as standalone

---

## Guardrails
- No large new features until Phase 1–4 are stable.
- Prefer full-file replacements.
- Keep the system calm: fewer controls, clearer hierarchy.
- Any gesture system must be deterministic (no overlapping hit regions).
