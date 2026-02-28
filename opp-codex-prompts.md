# OPP Typography Refactor — Codex Prompt Playbook
Run these prompts in order. Complete and verify each step before moving to the next.

---

## PHASE 1 — Setup & Config

### Prompt 1.1 — Install Geist
```
Install the Geist font package:
npm install geist

Do not modify any files yet. Just confirm the install succeeded.
```

### Prompt 1.2 — Wire up fonts in layout.tsx
```
Update layout.tsx to import Geist and Geist_Mono from 'next/font/google'.
Configure both with the Latin subset.
Assign CSS variables: --font-geist and --font-geist-mono.
Apply both variable class names to the root <html> element.
Do not change anything else in this file.
```

### Prompt 1.3 — Tailwind config
```
Open tailwind.config.ts and extend the theme with the following.
Do not replace existing config, only add to the extend block:

fontFamily:
  sans: ['var(--font-geist)', 'SF Pro Display', 'sans-serif']
  mono: ['var(--font-geist-mono)', 'SF Mono', 'monospace']

fontSize:
  hero:    ['3.5rem',    { lineHeight: '1',    letterSpacing: '-0.03em', fontWeight: '800' }]
  title:   ['2rem',      { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '700' }]
  heading: ['1.125rem',  { lineHeight: '1.35', letterSpacing: '0',       fontWeight: '600' }]
  task:    ['1rem',      { lineHeight: '1.35', letterSpacing: '0',       fontWeight: '500' }]
  meta:    ['0.8125rem', { lineHeight: '1',    letterSpacing: '0.06em',  fontWeight: '400' }]
  label:   ['0.6875rem', { lineHeight: '1',    letterSpacing: '0.12em',  fontWeight: '600' }]

colors (inside existing colors or extend):
  text-primary:   rgba(255,255,255,1.00)
  text-secondary: rgba(255,255,255,0.60)
  text-tertiary:  rgba(255,255,255,0.35)
  text-accent:    #4A9EFF
  text-disabled:  rgba(255,255,255,0.20)

Show me the diff before applying.
```

### Prompt 1.4 — Import CSS variables
```
Import styles/opp-typography.css into the global stylesheet or layout.tsx
so the CSS custom properties are available globally.
Do not apply any classes yet.
```

---

## PHASE 2 — Component Refactor

Run one prompt per component. Replace [COMPONENT] with the actual file path.

### Prompt 2.1 — Session Header (OPP hero block)
```
Open [COMPONENT].
Find the session title (e.g. "OPP") and apply: text-hero font-sans tracking-tight font-black text-text-primary
Find the year accent (e.g. "2026") and apply: text-hero font-sans tracking-tight font-black text-text-accent
Find the date line (e.g. "SATURDAY: 2/21/26") and apply: text-title font-sans uppercase tracking-tight font-bold text-text-primary
Find all section labels (e.g. "ACTIVE SESSION") and apply: text-label font-sans uppercase tracking-widest font-semibold text-text-tertiary
Show me the diff before applying.
```

### Prompt 2.2 — Stat Cards (Completion, Weighted, Scheduled)
```
Open [COMPONENT].
Find the card section labels (e.g. "COMPLETION", "WEIGHTED") and apply: text-label uppercase tracking-widest font-semibold text-text-tertiary
Find the large percentage/number values (e.g. "0%", "1") and apply: text-[2.25rem] font-bold tracking-tight text-text-primary
Find the fraction or count labels (e.g. "0/7", "items") and apply: text-meta font-mono text-text-secondary
Show me the diff before applying.
```

### Prompt 2.3 — Work Stack / Task List
```
Open [COMPONENT].
Find all task title text and apply: text-task font-medium text-text-primary
Find all metadata lines (e.g. "@ 4:00 PM | NORMAL") and apply: text-meta font-mono text-text-secondary
Find the NORMAL/HIGH/LOW filter tabs:
  - Active tab: text-label uppercase tracking-widest font-semibold text-text-accent
  - Inactive tabs: text-label uppercase tracking-widest font-semibold text-text-tertiary
Find the section label "NORMAL" above the list and apply: text-label uppercase tracking-widest font-semibold text-text-tertiary
Show me the diff before applying.
```

### Prompt 2.4 — Schedule Rail
```
Open [COMPONENT].
Find all time labels (e.g. "6AM", "7AM") and apply: text-label font-mono tracking-wide text-text-tertiary
Find any scheduled task cards on the rail and apply title as: text-task font-medium text-text-primary
Find the time displayed on task cards (e.g. "4:00 PM") and apply: text-meta font-mono text-text-secondary
Show me the diff before applying.
```

### Prompt 2.5 — Archived Logs
```
Open [COMPONENT].
Find the section label "ARCHIVED LOGS" and apply: text-label uppercase tracking-widest font-semibold text-text-tertiary
Find the session date titles (e.g. "SATURDAY: 2/21/26") and apply: text-heading font-bold uppercase tracking-tight text-text-primary
Find the session metadata lines (e.g. "0% complete | 7 tasks | updated Feb 21") and apply: text-meta font-mono text-text-secondary
Show me the diff before applying.
```

---

## PHASE 3 — QA Checklist

Run this after all components are updated.

### Prompt 3.1 — Audit for stragglers
```
Search the entire codebase for any remaining hardcoded font styles:
- font-size values in px or rem not using the type scale
- color values like #fff, white, gray that should use text-primary/secondary/tertiary
- font-weight numbers (400, 500, 700) that should use font-medium, font-bold etc.
- any remaining Arial, Inter, or system font references

List every file and line where these are found. Do not fix yet, just report.
```

### Prompt 3.2 — Fix stragglers
```
For each item found in the audit, replace with the correct Tailwind class or 
CSS variable from the type system. Show a diff for each file before applying.
```

---

## QUICK REFERENCE — Type Role → Tailwind Class

| Role | Tailwind Classes |
|---|---|
| Hero title | `text-hero font-black tracking-tight text-text-primary` |
| Hero accent | `text-hero font-black tracking-tight text-text-accent` |
| Page date | `text-title font-bold uppercase tracking-tight text-text-primary` |
| Section label | `text-label font-semibold uppercase tracking-widest text-text-tertiary` |
| Task title | `text-task font-medium text-text-primary` |
| Metadata / tag | `text-meta font-mono tracking-wide text-text-secondary` |
| Stat number | `text-[2.25rem] font-bold tracking-tight text-text-primary` |
| Schedule time | `text-label font-mono tracking-wide text-text-tertiary` |
| Body / helper | `text-meta text-text-secondary leading-relaxed` |
| Accent tag | `text-label font-semibold uppercase tracking-widest text-text-accent` |

---

## NOTES FOR CODEX

- Always ask for a diff before applying changes
- Do one component file at a time
- Do not change layout, spacing, or colors outside of typography
- If unsure which element maps to which role, ask before guessing
- After each phase, confirm in the browser before continuing
