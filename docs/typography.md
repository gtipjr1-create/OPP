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
