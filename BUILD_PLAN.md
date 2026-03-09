# OPP — Next Session Phases
## Mobile Compression + Operational Polish

### Objective
Transform the mobile session page into a tighter execution-first command surface by compressing summary UI, lightening task capture, refining list rows, stabilizing interactions, and collapsing secondary sections by default.

---

## Phase 1 — Condense session summary block
**Goal:** Reduce above-the-fold height and turn the metrics area into a lighter status summary.

### Implement
- Replace the tall 3-row summary card with a compact stat strip
- Keep:
  - Completion
  - Weighted
  - Scheduled count
- Remove:
  - long helper copy
  - oversized row spacing
  - heavy divider treatment
- Reduce padding so it reads as operational status, not a dashboard card

### Deliverable
A slimmer session summary that keeps the signal but gives more space back to Work Stack.

---

## Phase 2 — Convert Work Stack composer into compact inline capture
**Goal:** Make task entry faster and reduce the heavy “form inside a card” feeling.

### Implement
- Remove the large “Add task…” composer treatment
- Remove the large white `ADD` button
- Replace with a compact inline task capture row
- Make the input clearly tappable without being oversized
- On tap:
  - focus input
  - allow fast entry
  - add directly into the list
- Collapse back into clean idle state after submit if appropriate

### Deliverable
A faster, lighter add-task experience that feels native to a one-screen command surface.

---

## Phase 3 — Integrate priority controls with the composer
**Goal:** Make task creation feel tighter and more unified.

### Implement
- Refine `High / Normal / Low` chips
- Reduce excess spacing between composer and priority controls
- Make them feel like part of one capture system, not separate stacked blocks
- Keep chips thumb-friendly but visually tighter

### Deliverable
A cleaner task-entry zone with better rhythm and less vertical waste.

---

## Phase 4 — Redesign checkbox system
**Goal:** Make completion controls feel more premium, brand-aligned, and mobile-friendly.

### Implement
- Increase checkbox tap target
- Shift away from bright white fill
- Use a darker unchecked state
- Use blue check marks for completed state
- Keep border/fill subtle and integrated with the dark UI
- Ensure checkbox is easy to hit without looking oversized

### Deliverable
A cleaner, darker checkbox style with stronger touch usability and better visual consistency.

---

## Phase 5 — Refine task rows to feel less blocky
**Goal:** Make the list cleaner, more uniform, and less like stacked slabs.

### Implement
- Slightly reduce row height
- Tighten top/bottom padding
- Reduce overly heavy card feel
- Soften fill/border contrast
- Improve spacing between:
  - checkbox
  - title
  - metadata
- Keep row alignment consistent across all tasks

### Deliverable
Task rows that feel like a polished operating list rather than a pile of large cards.

---

## Phase 6 — Standardize task row hierarchy
**Goal:** Improve scannability and consistency.

### Implement
- Lock row anatomy into:
  - left checkbox column
  - center content column
  - optional right action area
- Keep title visually primary
- Keep metadata smaller and quieter
- Standardize metadata formatting:
  - time
  - separator
  - priority
- Ensure rows remain stable with short and long task names

### Deliverable
A cleaner row pattern that feels deliberate and repeatable throughout the list.

---

## Phase 7 — Fix swipe/edit interaction jank
**Goal:** Make swipe actions smooth and stable instead of disruptive.

### Implement
- Prevent row layout reflow during swipe
- Keep row height fixed while actions reveal
- Use a stable action-reveal width
- Avoid content jumping or shifting unpredictably
- Make swipe expose quick actions only
- Keep full edit mode separate from the swipe gesture if needed

### Deliverable
A calm, reliable swipe interaction that feels controlled on mobile.

---

## Phase 8 — Make Schedule section compact and collapsed by default
**Goal:** Reclaim vertical space and keep Schedule secondary until needed.

### Implement
- Convert Schedule into a minimal collapsible utility section
- Match the interaction model of Archived Logs
- Default to collapsed
- Use slim header row:
  - left: `SCHEDULE`
  - right: `SHOW (1)` / `HIDE`
- Remove empty panel height when collapsed
- Reveal scheduled content only on demand

### Deliverable
A small utility rail for Schedule that supports one-screen usage without permanent height cost.

---

## Phase 9 — Align secondary sections under one mobile pattern
**Goal:** Make the lower half of the screen feel organized and disciplined.

### Implement
- Use the same collapsed/minimal logic for secondary utility sections
- Ensure Schedule and Archived Logs feel visually related
- Standardize:
  - header height
  - toggle pill sizing
  - spacing
  - collapse behavior

### Deliverable
A more consistent mobile section system with less visual noise.

---

## Phase 10 — Final mobile compression pass
**Goal:** Tune the entire page for minimal scroll and better execution flow.

### Review and tighten
- header-to-summary spacing
- summary-to-work-stack spacing
- composer spacing
- list spacing
- schedule spacing
- archived spacing
- empty-state spacing
- section shell padding

### Deliverable
A near one-screen mobile command center with much less wasted vertical real estate.

---

## Suggested Build Order

### Track A — Highest impact first
1. Phase 1 — Condense session summary
2. Phase 2 — Compact inline task capture
3. Phase 4 — Checkbox redesign
4. Phase 5 — Less blocky task rows
5. Phase 8 — Collapsed minimal Schedule

### Track B — Polish and stability
6. Phase 3 — Priority chip integration
7. Phase 6 — Standardize row hierarchy
8. Phase 7 — Fix swipe/edit jank
9. Phase 9 — Align secondary sections
10. Phase 10 — Final compression passy