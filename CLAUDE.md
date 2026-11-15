# BodyMap: Crew Health

A web app for the 2026 NASA Space Apps Challenge, *Create Health Monitoring Software for Astronauts on Space Missions*. Astronauts tap a body system on an interactive figure, see a green/amber/red status, and get guidance on what to do, worded for their mission's communication delay. Solo project; demo software, not medical advice.

**Status:** planning. No app code yet. Don't scaffold or write app code until asked.

## Plan files (source of truth)

| File | What it holds |
|---|---|
| [plan/challenge-statement.md](plan/challenge-statement.md) | The challenge |
| [plan/roadmap.md](plan/roadmap.md) | Goal, decisions, scope, mission profiles, phases, cut order, key dates |
| [plan/tasks.md](plan/tasks.md) | Architecture overview and the step-by-step task checklist (features numbered like 3.2) |
| [plan/site-map.md](plan/site-map.md) | Pages, routes, system slugs, overlays, header, notification bell, layouts |
| [plan/body-systems.md](plan/body-systems.md) | 8 systems, 28 indicators, thresholds, actions, escalation, check-in design, profile, countermeasure questions |
| [plan/health-indicators.md](plan/health-indicators.md) | Source of each indicator (direct / proxy / added) |
| [plan/articles/](plan/articles/) | NASA HRP and CSA background articles (Markdown with front matter) |

`plan/messages/` holds the user's personal Space Apps messages. It is git-ignored; never commit or publish it.

## Stack

Vite + React + TypeScript, Tailwind CSS, Recharts, React Router (hash routing), Vitest. Client-only: data in `localStorage`, no backend, no login.

## Architecture rules

- `src/data/` holds all health content (`systems.ts`, `missions.ts`). Components never hard-code health text.
- `src/lib/` holds all logic as pure, unit-tested functions (status, trends, derived values, triggers, scheduler, seed, storage). No React there.
- `src/state/` is one context + reducer; `src/pages/` and `src/components/` only render.
- Demo crew data is generated deterministically on load and never stored. Only user-entered data goes into `localStorage`, through `src/lib/storage.ts` only.
- System ids are the slugs in [plan/site-map.md](plan/site-map.md#system-slugs); never change them.
- Thresholds are illustrative demo values; keep the disclaimer.

## How to work with the user

- Build one small feature at a time (e.g. "do 1.5"), then explain what was added, how data flows, and why. The user wants to understand the code and architecture.
- Write unit tests for `src/lib/` functions; run the app after each feature.
- Tick off steps in `plan/tasks.md` as they're completed.
- Answer questions without editing files; change plan files only when the user asks.
- Commit only when the user asks.

## Tools

The project skill `nasa-article-extract` (`.claude/skills/nasa-article-extract/`) extracts NASA.gov and CSA articles into `plan/articles/`.
