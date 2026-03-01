# OPP UI Standards

## Purpose
Keep OPP visually consistent, production-clean, and predictable by enforcing typography, color token, and spacing rules through shared primitives and lint checks.

## Typography Rules
- Use role classes from `docs/typography.md` and Tailwind v4 `@theme` tokens.
- Do not use raw size utilities for text in app UI:
  - `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- Do not use raw text color utilities for typography:
  - `text-white`, `text-white/*`, `text-blue-*`, `text-zinc-*`, `text-gray-*`

## Spacing Rules
- Major section spacing: `mt-4`
- Internal card padding: `p-4`
- Stacked lists: `space-y-2`
- Label to content rhythm: `mt-2`

## Component Rules
- Use shared UI primitives where available:
  - `src/components/ui/Button.tsx`
  - Add future primitives in `src/components/ui/` (`Card`, `Input`, `Badge`, `SectionHeader`)
- Keep feature components focused on behavior and composition, not repeated style blobs.

## CI Guardrail
- `npm run lint` runs:
  1. `scripts/check-ui-typography.mjs`
  2. `eslint`
- Any banned class token in `src/**/*.ts(x)` fails the check.

## Definition of Done (UI changes)
- No banned typography tokens introduced.
- Uses OPP role classes/tokens.
- Uses shared UI primitives where possible.
- Passes `npm run lint`.
