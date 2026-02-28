# OPP — Organized Persistent Plans
> This is the only project in context. Do not reference FitPulse or any other project.

## Project Overview
A productivity and planning app for managing daily sessions, tasks, and schedules.
Live at: https://opp-psi.vercel.app

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (Postgres + Auth + RLS)
- **Deployment**: Vercel
- **Fonts**: Geist + Geist Mono (next/font)

## Typography System
- Typography scale and CSS variables are defined in `styles/opp-typography.css`
- Always use the type roles defined in that file
- Font setup lives in `layout.tsx` using Geist and Geist Mono
- Tailwind font/color extensions are in `tailwind.config.ts`

## Type Role Reference
| Role | Tailwind Classes |
|---|---|
| Hero title | `text-hero font-black tracking-tight text-text-primary` |
| Page date | `text-title font-bold uppercase tracking-tight text-text-primary` |
| Section label | `text-label font-semibold uppercase tracking-widest text-text-tertiary` |
| Task title | `text-task font-medium text-text-primary` |
| Metadata / tag | `text-meta font-mono tracking-wide text-text-secondary` |
| Stat number | `text-[2.25rem] font-bold tracking-tight text-text-primary` |
| Schedule time | `text-label font-mono tracking-wide text-text-tertiary` |
| Accent tag | `text-label font-semibold uppercase tracking-widest text-text-accent` |

## Architecture
- SSR authentication with middleware
- Protected routes
- Server actions for data mutations
- Position-based task ordering
- Priority stored structurally (not parsed)
- Stable insert pipeline

## Design Language
- Dark background: `#0a0a0a`
- Blue accent: `#4A9EFF`
- Premium and refined aesthetic — Apple-level polish
- OPP mark: animated double ring SVG component (`OppMark.tsx`)

## Rules for Codex
- Always work within the OPP project only
- Follow the typography system in `styles/opp-typography.css`
- Show diffs before applying any changes
- Do one component at a time
- Do not modify layout, spacing, or colors unless specifically asked
- Do not reference or import anything from FitPulse or any other project
