# Weekly Cleanup Ritual

Run this once per week to keep OPP stable and maintainable.

## 30-Minute Pass
1. Remove dead files/unused exports left by refactors.
2. Scan for duplicated UI class blobs and consolidate shared patterns.
3. Verify docs are current:
   - `docs/release-checklist.md`
   - `docs/definition-of-done.md`
   - `docs/task-row-state-matrix.md`
4. Review new telemetry events for naming consistency and actionability.

## Required Commands
- `npm run lint`
- `npm test`
- `npm run test:e2e` (or log deferral reason)

## Focus Areas
- Task row interactions on mobile and desktop.
- Error/loading/empty state behavior.
- Accessibility regressions (keyboard, focus-visible, touch targets).

## Output
- One cleanup commit (or a short note saying no cleanup changes were needed).
