# Task Row State Matrix

Use this checklist before merging task-row UI or interaction changes.

## Viewports
- Mobile: 390x844
- Desktop: 1280x900

## States
- Normal
- Done
- Editing
- Confirm Delete
- Drag Active
- Locked (actions disabled)

## Checks Per State
- No text overflow into action buttons
- Row height/padding stable (no jump)
- Focus-visible styles present for keyboard navigation
- Touch targets >= 44px for interactive controls
- Confirm delete (if active) is exclusive (normal content hidden)

## Execution
1. Run `npm run lint`
2. Run `npm test`
3. Run `npm run test:e2e` (or note deferral)
4. Validate screenshots in `e2e/task-row-visual.spec.ts`

## Notes
- If only one viewport is affected, still verify both.
- If a state changes markup, add/update corresponding screenshot baseline.
