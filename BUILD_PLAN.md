# OPP — Next Session Phases
## Post-Phase-10 Refinement Pass

### Objective
Build on the stronger mobile command-surface direction by tightening top-of-screen hierarchy, refining Work Stack empty-state behavior, and continuing the shift from visual compression into more stable real-use testing.

---

## Phase 11 — Micro-compress the top session stack
**Goal:** Tighten the top area so it reaches action faster without losing identity.

### Implement
- Reduce vertical spacing between:
  - section label and icon
  - icon and date title
  - title and pill row
  - pill row and meta line
  - meta line and summary strip
- Keep the top visually premium, but less ceremonious
- Preserve readability while making the whole header stack feel tighter on mobile

### Deliverable
A more compact session header that gets the user into Work Stack faster.

---

## Phase 12 — Refine icon footprint and title balance
**Goal:** Keep identity at the top of the page while reducing unnecessary visual weight.

### Implement
- Slightly reduce the central icon size, or keep size and reduce surrounding margin
- Ensure the date title remains the primary anchor of the top section
- Rebalance icon-to-title spacing so the icon supports the header instead of dominating it

### Deliverable
A cleaner top anchor with stronger hierarchy and less wasted vertical space.

---

## Phase 13 — Tighten summary strip shell and stat internals
**Goal:** Make the stats area feel like a compact operational readout instead of a secondary hero block.

### Implement
- Reduce outer shell padding around the stat strip
- Slightly reduce stat-card height if safe for readability
- Tighten label/value/subvalue spacing inside each stat card
- Keep the 3-up structure, but make it feel denser and calmer

### Deliverable
A slimmer summary strip with better scan speed and less visual mass.

---

## Phase 14 — Sharpen Work Stack empty state
**Goal:** Make the empty state helpful without letting it become another oversized content block.

### Implement
- Slightly reduce empty-state height
- Refine empty-state copy if needed so it stays clear and minimal
- Keep the message supportive, but lighter in visual presence
- Ensure the empty-state panel fits the cleaner, utility-first direction of the section

### Deliverable
A more disciplined empty state that supports first use without bloating the card.

---

## Phase 15 — Review plus-button visual dominance
**Goal:** Make sure the quick-add action feels strong without overpowering the input row.

### Implement
- Assess whether the plus button is slightly too visually dominant
- If needed, reduce shell weight, fill intensity, or border emphasis
- Keep tap confidence high while bringing it into better balance with the input field

### Deliverable
A quick-add action that feels clear, usable, and integrated with the Work Stack composer.

---

## Phase 16 — Stabilize current layout for self-testing
**Goal:** Pause major redesigning long enough to observe real usage honestly.

### Implement
- Freeze the current layout direction for a short testing window
- Use the page repeatedly in normal workflow
- Record friction points such as:
  - hesitation
  - missed taps
  - awkward scroll moments
  - controls that feel unclear
  - elements that get ignored
- Avoid redesigning every small thing immediately during the observation period

### Deliverable
A cleaner evidence base for the next round of changes.

---

## Phase 17 — Convert observations into a behavior-based polish pass
**Goal:** Let real usage guide the next layer of refinement.

### Implement
- Review self-testing notes
- Separate issues into:
  - hierarchy problems
  - interaction problems
  - spacing problems
  - visual polish opportunities
- Prioritize actual friction over hypothetical tweaks
- Use the findings to define the next focused pass instead of reopening broad redesign mode

### Deliverable
A more grounded next-phase roadmap based on use, not just instinct.

---

## Suggested Build Order

### Track A — Immediate UI tightening
1. Phase 11 — Micro-compress the top session stack
2. Phase 12 — Refine icon footprint and title balance
3. Phase 13 — Tighten summary strip shell and stat internals
4. Phase 14 — Sharpen Work Stack empty state
5. Phase 15 — Review plus-button visual dominance

### Track B — Maturity / validation
6. Phase 16 — Stabilize current layout for self-testing
7. Phase 17 — Convert observations into a behavior-based polish pass
