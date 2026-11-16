# BodyMap: Crew Health

**Tap a system, see your status.**

BodyMap is a self-assessment tool for astronauts on long-duration missions. An interactive human figure shows the status of each body system — heart & circulation, eyes & brain (SANS), bones & muscles, immune system, metabolism & nutrition, mind & sleep, balance, and radiation exposure — color-coded green, amber, or red at a glance. Tap a system to see its indicators, trends over the mission, why they change in space, how to measure them, and what to do next, including when to contact flight surgeons given the mission's communication delay. Switch between ISS, Artemis lunar, and Mars-transit profiles to see how guidance changes as crews get farther from Earth.

Built for the 2026 NASA Space Apps Challenge — *Create Health Monitoring Software for Astronauts on Space Missions*. Background research: NASA Human Research Program and Canadian Space Agency sources (see [plan/resources.md](plan/resources.md) and [plan/articles/](plan/articles/)). Roadmap: [plan/roadmap.md](plan/roadmap.md).

[plan/articles/](plan/articles/) holds reference copies of public NASA and CSA pages, each with its source link, used as research for the health content. They are not original writing.

> Demo software for a hackathon. Thresholds and guidance are illustrative, not medical advice.

**Live demo:** https://doncastillo.github.io/NASA-App-2026/

## Getting started

You need [Node.js](https://nodejs.org/) (current LTS or newer).

```bash
npm install
npm run dev        # http://localhost:5173
```

On the first visit a welcome screen and a 6-step tour explain the app. Choose **Explore demo crew** to look around with three generated crew members, or **Set up my profile** to enter your own. You can replay both from **About**.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm test` | Run the unit and component tests (Vitest) |
| `npm run lint` | Lint with oxlint |
| `npm run format` | Format with Prettier |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the built app locally |

Every push to `main` builds and deploys the app to GitHub Pages ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

## Tech stack

- **Vite + React + TypeScript.** A client-only single-page app with no backend and no login.
- **Tailwind CSS.** Theme tokens (colors, radii, fonts) live in [src/index.css](src/index.css) and follow [plan/branding.md](plan/branding.md).
- **React Router.** Hash routing, so the app works on GitHub Pages without server rewrites.
- **Zustand.** One small store for selection and saved data.
- **Recharts.** Trend charts on each system's detail panel.
- **date-fns** for dates and **lucide-react** for icons.
- **Vitest + Testing Library + jsdom** for tests.

## Architecture

```
src/
  data/        Health content only: systems, indicators, thresholds, actions, missions, articles, text
  lib/         All logic as pure, unit-tested functions (no React)
  state/       The Zustand store, memoized selectors, and hooks such as useTasks
  components/  Reusable UI: header, body figure, menus, overlays, check-in inputs
  pages/       One file per route: Body Map, System detail, Check-in, Routine, Setup, About
```

**Data flow.** The store holds what is selected (crew member, mission) and what the user has entered. Selectors turn that into a *dataset*, which `lib/health.ts` turns into a *health picture*: a status for each system, the reason, references and trends. Pages and components only render that picture. They never compute health or hard-code health text.

```
localStorage ──► store ──► selectDataset ──► computeHealth ──► Body Map, System detail, Check-in
                   ▲            ▲                    │
     user entries ─┘   generated demo history        └──► scheduleTasks ──► 🔔 bell, Routine, nav badges
```

- **Demo crew.** Each demo crew member's mission history is generated deterministically from a seed (`lib/seed.ts`) when the app loads, and never stored. Only what the user enters goes to `localStorage`, through `lib/storage.ts`.
- **Status rules** (`lib/status.ts`, `lib/trends.ts`). Each indicator is scored green, amber or red from bands in `data/systems/`, optionally against the crew member's own baseline. Cross-indicator rules and multi-day trends come next. A system takes the status of its worst indicator.
- **Check-in engine** (`lib/triggers.ts`). Builds the question list from the check-in tiers: daily core questions, follow-ups opened by earlier answers, weekly items, and checks after logged events. The list is rebuilt after every answer, so follow-ups appear as soon as they apply.
- **Scheduler** (`lib/scheduler.ts`). Turns check-ins, events and statuses into the day's tasks: rechecks, post-event checks, the daily check-in and weekly items, each due, overdue or done, in priority order.
- **Guidance by mission** (`data/missions.ts`). Comms delay, radiation rate, dose budget and escalation wording per mission (ISS, Artemis lunar, Mars transit). Guidance changes as the crew gets farther from Earth.

Thresholds are illustrative demo values. The source of each indicator (direct, proxy or added) is listed in [plan/health-indicators.md](plan/health-indicators.md).
