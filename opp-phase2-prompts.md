# OPP — Phase 2 Prompt Playbook
Run these in order. Complete and verify each step before moving to the next.

---

## STEP 1 — Typography Roles Reference Doc

### Prompt 1.1 — Create docs/typography.md
```
Create a new file at docs/typography.md with the following content:

# OPP Typography Roles

## Type Scale
| Role | Class | Size | Weight | Use When |
|---|---|---|---|---|
| Hero | text-hero | 3.5rem | 800 | Session title, app name |
| Title | text-title | 2rem | 700 | Page date, screen headings |
| Heading | text-heading | 1.125rem | 600 | Card headings |
| Task | text-task | 1rem | 500 | Task titles, input text, body |
| Meta | text-meta | 0.8125rem | 400 | Timestamps, counts, helper text |
| Label | text-label | 0.6875rem | 600 | Section headers, tags, buttons |

## Color Tokens
| Token | Value | Use When |
|---|---|---|
| text-text-primary | white 100% | Main content, task titles |
| text-text-secondary | white 60% | Metadata, timestamps, descriptions |
| text-text-tertiary | white 35% | Section labels, placeholders, disabled |
| text-text-accent | #4A9EFF | Active states, highlights, OPP blue |
| text-text-disabled | white 20% | Disabled elements |

## Font Families
| Token | Font | Use When |
|---|---|---|
| font-sans | Geist | All UI text |
| font-mono | Geist Mono | Timestamps, metadata, counts |

## Rules
- Section labels always: text-label font-sans uppercase tracking-widest font-semibold text-text-tertiary
- Task titles always: text-task font-medium text-text-primary
- Metadata always: text-meta font-mono tracking-wide text-text-secondary
- Buttons always: text-label font-sans uppercase tracking-widest font-semibold
- Never use: text-xs, text-sm, text-white/*, text-blue-*, text-zinc-*
```

---

## STEP 2 — Token Pass on Remaining Components

### Prompt 2.1 — Audit all remaining files
```
Search all .tsx and .ts files in src/ (excluding node_modules) for:
- text-xs, text-sm, text-base, text-lg, text-xl, text-2xl
- text-white, text-white/*, text-blue-*, text-zinc-*, text-gray-*
- font-bold, font-extrabold not paired with a type role class

Exclude files already cleaned:
- src/features/tasks/components/TasksScreen.tsx
- src/features/tasks/components/TaskItem.tsx

List every file, line number, and the offending class.
Do not fix yet, just report.
```

### Prompt 2.2 — Fix each file (run once per file found)
```
In [FILE PATH], apply the OPP typography system from docs/typography.md.
Replace all raw text-xs/sm/white/* classes with the correct type role classes.
Show diff before applying.
```

---

## STEP 3 — Spacing Rhythm

### Prompt 3.1 — Define spacing scale
```
In src/app/globals.css, inside the @theme block,
add the following spacing rhythm tokens after the color tokens:

  /* Spacing Rhythm */
  --spacing-section: 1.75rem;   /* 28px — between major sections */
  --spacing-card: 1rem;         /* 16px — internal card padding */
  --spacing-stack: 0.75rem;     /* 12px — between stacked items */
  --spacing-tight: 0.5rem;      /* 8px  — between related elements */

Show diff before applying.
```

### Prompt 3.2 — Audit spacing inconsistencies
```
In src/features/tasks/components/TasksScreen.tsx,
find all mt-*, mb-*, py-*, px-*, gap-*, space-y-* values.
List any that seem inconsistent or arbitrary (e.g. mt-7, mt-3, mt-4 mixed randomly).
Do not fix yet, just report.
```

### Prompt 3.3 — Apply consistent spacing
```
Based on the audit, standardize spacing in TasksScreen.tsx:
- Between major sections (cards): mt-4 consistently
- Internal card padding: p-4 consistently  
- Between stacked list items: space-y-2 consistently
- Between label and content: mt-2 consistently
Show diff before applying.
```

---

## STEP 4 — Standardize Button Variants

### Prompt 4.1 — Create button component
```
Create a new file at src/components/ui/Button.tsx with these variants:

Primary: white background, black text — main CTA (New Session)
Secondary: transparent, white/20 border, text-text-secondary — supporting actions (Duplicate)
Ghost: no background, no border, text-text-tertiary — low emphasis (Export)
Danger: red/20 background, text-red-200 — destructive actions (Delete)

All buttons:
- min-h-[44px] for touch targets
- rounded-2xl
- text-label font-sans uppercase tracking-widest font-semibold
- hover and disabled states
- accepts: onClick, disabled, children, className props

Show the complete file before creating.
```

### Prompt 4.2 — Replace buttons in TasksScreen
```
In src/features/tasks/components/TasksScreen.tsx,
import Button from '@/components/ui/Button' and replace:
- New Session button → <Button variant="primary">
- Duplicate button → <Button variant="secondary">
- Export button → <Button variant="ghost">
- Delete confirm button → <Button variant="danger">
Show diff before applying.
```

---

## STEP 5 — OppMark Usage Rules

### Prompt 5.1 — Define OppMark usage
```
OppMark should only appear in these locations:
1. Session header (already done — size={48})
2. Loading/splash state if one exists
3. Browser tab favicon (already handled via /icon.png)

Search the entire src/ directory for any other usage of OppMark 
or any place where a logo/brand mark might be needed.
List what you find. Do not change anything yet.
```

### Prompt 5.2 — Add loading state (optional)
```
If there is a loading state in src/app/page.tsx or 
src/features/tasks/components/TasksScreen.tsx,
replace any spinner or loading indicator with:
<OppMark size={32} />
Show diff before applying.
```

---

## STEP 6 — Tag the Milestone

### Run in terminal:
```bash
git add .
git commit -m "OPP: Tailwind v4 tokens + typography roles + spacing rhythm + button variants"
git tag opp-ui-system-v1
git push
git push --tags
```

---

## QUICK REFERENCE — What's done vs what's next

| Step | Status | Description |
|---|---|---|
| Geist font setup | ✅ Done | layout.tsx wired |
| Tailwind v4 @theme | ✅ Done | globals.css |
| Full type scale | ✅ Done | all roles defined |
| TasksScreen refactor | ✅ Done | zero hardcoded styles |
| TaskItem refactor | ✅ Done | zero hardcoded styles |
| OppMark animated | ✅ Done | src/components/OppMark.tsx |
| Archived logs collapse | ✅ Done | toggle state |
| Typography docs | ⬜ Next | docs/typography.md |
| Remaining component audit | ⬜ Next | other screens |
| Spacing rhythm | ⬜ Next | @theme tokens |
| Button variants | ⬜ Next | ui/Button.tsx |
| OppMark rules | ⬜ Next | consistent usage |
| Git tag milestone | ⬜ Next | opp-ui-system-v1 |
