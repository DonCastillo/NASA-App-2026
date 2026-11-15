# BodyMap: Crew Health — Tasks

Task checklist for each phase in [roadmap.md](roadmap.md). Pages and routes are in [site-map.md](site-map.md); health content, indicators and check-in rules are in [body-systems.md](body-systems.md). Tick items off as they're done.

Big features are split into small features (numbered, e.g. **3.2**), and each small feature into steps that take roughly 15–45 minutes. Each step should leave the app running, so you can see what every piece does before moving on.

## Architecture at a glance

How data flows through the app. Every screen reads from the same few modules, so once you know these, you know the app.

```
 src/data/systems.ts ─┐   (content: systems, indicators, thresholds, actions)
 src/data/missions.ts ┤   (mission profiles: length, delay, radiation, wording)
                      ▼
 src/lib/  status.ts · trends.ts · derived.ts · triggers.ts · scheduler.ts
           (pure functions: readings in → statuses, follow-ups, tasks out)
                      ▲                         │
 src/lib/seed.ts ─────┤ demo crew history       │
 src/lib/storage.ts ──┘ user entries            ▼
                                   src/state/ (app store: current crew, mission, data)
                                                │
                                                ▼
                         src/pages/ + src/components/ (render only)
```

| Folder / file | Role |
|---|---|
| `src/types.ts` | Shared TypeScript types: `SystemId`, `Indicator`, `Reading`, `CheckIn`, `Profile`, `Mission`, `MissionEvent`, `Task`, `Status` |
| `src/data/` | Static content. No logic |
| `src/lib/` | Pure functions with unit tests. No React |
| `src/state/` | One Zustand store holding the current crew member, mission and data |
| `src/pages/` | One component per route: BodyMap, SystemDetail, CheckIn, Routine, Setup, About |
| `src/components/` | Reusable pieces: Header, Nav, BodyFigure, Pin, IndicatorCard, TrendChart, ScaleButtons, Stepper, Overlay… |

Rules that keep it simple:
- **Content lives only in `src/data/`.** Components never hard-code health text.
- **Logic lives only in `src/lib/`.** Components call functions; they don't calculate.
- **Demo data is generated, not stored.** Only what users enter goes into `localStorage`.

---

## Phase 0 — Setup (≈1 h)

### 0.1 Project scaffold
- [x] Create the Vite + React + TypeScript project; run it locally
- [x] Add Tailwind CSS; confirm one styled element renders
- [x] Add Recharts, React Router (hash router), Zustand, date-fns, lucide-react and Vitest
- [x] Add linting (oxlint, from the Vite template, instead of ESLint) and Prettier, and an `npm test` script
- [x] Install `@fontsource/inter` and `@fontsource/jetbrains-mono`

### 0.2 Folder structure
- [x] Create `src/types.ts`, `src/data/`, `src/lib/`, `src/state/`, `src/pages/`, `src/components/`
- [x] Add an empty placeholder component for each of the 6 pages
- [x] Wire the 6 routes with hash routing (`/`, `/system/:id`, `/check-in`, `/routine`, `/setup`, `/about`); unknown routes fall back to `/`

### 0.3 First deploy
- [x] Choose GitHub Pages or Netlify → GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- [x] Deploy the placeholder app; open every route on the public URL → https://doncastillo.github.io/NASA-App-2026/

### 0.4 Theme ([branding.md](branding.md))
- [x] Tailwind tokens: colors (`space-*`, `text`, `text-muted`, `accent`, `ok`, `warn`, `alert`, `alert-text`, `none`), fonts (Inter, JetBrains Mono), radii (8 / 12 px)
- [x] Base styles: `space-950` background, `text` color, Inter body, tabular-number mono class for readings
- [x] Global focus ring (2 px `accent`, 2 px offset) and `prefers-reduced-motion` handling
- [x] Logo SVG component (orbit ring + silhouette + cyan pin) and favicon

**Done when:** an empty app with 6 routes builds, tests run, uses the dark theme, and it's live at a public URL.

---

## Phase 1 — Health model (≈3 h)

### 1.1 Types
- [x] `SystemId` union using the slugs from [site-map.md](site-map.md#system-slugs) (`heart`, `eyes`, `bones`, `immune`, `metabolism`, `mind`, `balance`, `radiation`)
- [x] `Status` (`green` | `amber` | `red` | `none`), `InputType` (number, number pair, severity 0–3, rating 1–5, yes/no, checklist, calculated)
- [x] `Indicator`, `Threshold`, `SystemDef`, `MissionProfile` types
- [x] `Profile`, `Baselines`, `Reading`, `CheckIn`, `MissionEvent`, `CountermeasureAnswer`, `Task` types

### 1.2 `src/data/systems.ts` — one system at a time
- [ ] Add Heart & circulation fully (4 indicators, thresholds, how to measure, why in space, actions per status, sources) as the template
- [ ] Add Eyes & brain, Bones & muscles
- [ ] Add Immune, Metabolism & nutrition
- [ ] Add Mind & sleep, Balance & orientation, Radiation
- [ ] Add the body-map pin position and label for each system
- [ ] Check: 8 systems, 28 indicators, each with a source type (direct / proxy / added) matching [health-indicators.md](health-indicators.md)

### 1.3 `src/data/missions.ts`
- [ ] ISS, Artemis lunar, Mars transit with default length (180 / 30 / 210 days)
- [ ] Comms delay: fixed for ISS and Artemis; a function of mission day for Mars transit (~0 → ~20 min)
- [ ] Radiation daily rate and built-in dose budget per mission
- [ ] Escalation wording per status per mission ([Escalation by mission](body-systems.md#escalation-by-mission))

### 1.4 `src/data/` supporting content
- [ ] Countermeasure and medication questions (10), with trigger and frequency ([body-systems.md](body-systems.md#countermeasure-and-medication-questions))
- [ ] Supplement / medication pick list for the profile
- [ ] Event types: spacewalk, landing/docking, gravity transition

### 1.5 `src/lib/status.ts` — scoring rules
- [ ] `scoreIndicator(indicator, value, baseline?)` → status, for each input type
- [ ] Baseline-relative scoring (% of baseline, lines worse than baseline)
- [ ] `scoreSystem(readings)` → worst status of its indicators; `none` if nothing recorded
- [ ] `statusReason()` → the one plain sentence for the System detail header (from the indicator driving the status)
- [ ] Unit tests: sample readings for every system land in the expected color

### 1.6 `src/lib/trends.ts` — trend rules
- [ ] "3 amber readings in a row" raises amber
- [ ] Steady drift toward a threshold raises amber
- [ ] "N days in a row" rules (e.g. sleep < 6 h for 3 nights, exercise < 60 min for 3 days)
- [ ] Trend direction for the system list arrow (↑ ↗ → ↘ ↓)
- [ ] Unit tests

**Done when:** unit tests score sample readings into the expected colors for all 8 systems.

---

## Phase 2 — Seed data and storage (≈2 h)

### 2.1 Seed generator (`src/lib/seed.ts`)
- [ ] Deterministic random number generator (same seed → same data every load)
- [ ] 3 demo crew profiles (name, age, sex, height, preflight body mass, supplements/medications) with preflight baselines
- [ ] Daily history from day 1 up to a set current day per mission (ISS day 120 of 180, Artemis day 20 of 30, Mars day 150 of 210)

### 2.2 Encode article trends in the seed
- [ ] Bone density −1–1.5%/month; strength and aerobic fitness falling 10–12% by mission end
- [ ] Neutron dose ~150 µSv/day on ISS, scaled up for Artemis and Mars
- [ ] Sleep disruption and mood dips
- [ ] Gradual SANS onset in one crew member
- [ ] One immune episode (cold sore + fever) for a demo red alert
- [ ] Some events (spacewalk, landing) and countermeasure answers so chart markers show

### 2.3 Derived values (`src/lib/derived.ts`)
- [ ] Mission day and progress from start date and mission length
- [ ] Current comms delay from mission and mission day
- [ ] Estimated bone loss from mission day and exercise compliance
- [ ] Cumulative dose, % of mission budget, and daily dose rate
- [ ] Baseline fallback: average of the first 7 days of check-ins when a baseline is missing
- [ ] End-of-mission projections (bone loss, radiation dose)
- [ ] Unit tests

### 2.4 Storage (`src/lib/storage.ts`)
- [ ] One small module wrapping `localStorage` (read, write, versioned key); nothing else touches storage
- [ ] Save only user-entered data: user profiles, check-ins, events, countermeasure answers, notes, check-in drafts, small settings (selected crew/mission, welcome/tour seen)
- [ ] Merge user additions on top of generated demo history (for check-ins added to a demo crew member)
- [ ] "Reset demo data" deletes only additions to demo crew
- [ ] "Delete profile" removes one user profile and its data

### 2.5 App store (`src/state/`)
- [ ] Zustand store: current crew member, current mission, profiles, readings, events, and actions to change them
- [ ] Selectors: latest reading per indicator, status per system, readiness counts
- [ ] Load from seed + storage on start; save on every change

**Done when:** each crew member/mission shows a believable mix of green, amber and at least one red, and a refresh keeps user entries.

---

## Phase 3 — App shell and Body Map (≈4 h)

### 3.1 App shell
- [ ] Layout: header on top; bottom nav on phone, side nav on desktop (Body Map · Check-in · Routine · About)
- [ ] Active tab highlight; badge slot on Check-in and Routine

### 3.2 Header
- [ ] App name and Crew ▾ menu: demo crew, user profiles, "+ Add crew member", "Edit profile" → `/setup`
- [ ] Switching crew changes only whose data is shown (no data lost)
- [ ] Mission ▾ switcher (ISS / Artemis lunar / Mars transit)
- [ ] Mission day out of length, progress bar and comms delay (e.g. "Day 47/210 · 4 min delay")
- [ ] 🔔 bell placeholder and [Log event] button (wired in Phases 5–6)
- [ ] Phone layout: bell and Log event as icons; mission and day on one short line

### 3.3 Body figure (`BodyFigure`, `Pin`)
- [ ] Simple front-facing SVG outline
- [ ] 8 callout pins with lines to body parts, spread so head pins don't overlap; ☢ radiation badge beside the figure
- [ ] Pin shows status color + icon (✓ / ⚠ / ✖) + short label; `none` shown as grey "not recorded"
- [ ] Red pins pulse gently; color changes animate after a check-in
- [ ] Hover tooltip (system · status · latest change)
- [ ] Click / Enter opens `/system/:id`; Tab moves through pins

### 3.4 System list
- [ ] 8 rows with status, latest change and trend arrow
- [ ] Hovering a row highlights its pin, and the reverse
- [ ] Rows open `/system/:id` (keyboard and screen-reader path)

### 3.5 Home extras
- [ ] Readiness summary: green / amber / red counts and the most urgent item
- [ ] Alerts strip: red systems and an active solar particle event, each with its first action
- [ ] "Start daily check-in (~2 min)" button, shown only until today's check-in is done

**Done when:** clicking any pin or row opens that system, colors reflect the seeded data, and switching crew or mission updates everything.

---

## Phase 4 — System detail (≈4 h)

### 4.1 Panel container
- [ ] Side panel sliding in from the right on desktop (Body Map stays behind); full page on phone
- [ ] Same `/system/:id` route; ✕ and browser Back close it; refresh keeps it open; unknown id → home

### 4.2 Status and guidance
- [ ] Status header: system name, status (color + icon + word), reason sentence from `statusReason()`
- [ ] "What to do now": actions for the current status
- [ ] Escalation line worded for the selected mission and current comms delay
- [ ] Green state: "Keep your routine" plus one prevention tip

### 4.3 Indicator cards (`IndicatorCard`)
- [ ] Latest value, status, change vs baseline, time recorded
- [ ] "Not recorded" for skipped items
- [ ] Amber and red cards first

### 4.4 Trend charts (`TrendChart`)
- [ ] One small Recharts line chart per indicator from history
- [ ] Green / amber / red background bands and a dashed baseline line
- [ ] 7 d / 30 d / Mission range buttons
- [ ] Event markers (spacewalk, landing) and countermeasure markers (thigh cuffs, medication)
- [ ] Non-number indicators (scales, yes/no, checklist) shown as simple dot or bar timelines

### 4.5 Background sections
- [ ] Collapsible "Why this changes in space"
- [ ] Collapsible "How to measure" (same content as overlay C)
- [ ] Collapsible "Sources" linking to the original article pages
- [ ] "Check this system now" → `/check-in?system=<id>`

**Done when:** every system's panel is filled entirely from `systems.ts` and `missions.ts`, with no hard-coded health text in components.

---

## Phase 5 — Check-in, setup and events (≈3 h)

### 5.1 Check-in engine (`src/lib/triggers.ts`)
- [ ] Build the question list for a mode: daily, `?system=<id>`, `?task=<id>`
- [ ] Follow-up rules ([Triggers for follow-ups](body-systems.md#triggers-for-follow-ups)): symptoms = yes, mood ≤ 3, sleep < 7 h, temperature ≥ 37.3 °C, any amber/red core reading, gravity transition in the last 24 h
- [ ] Countermeasure question triggers (after headache, dizziness, amber BP/HR, poor sleep, before landing)
- [ ] Weekly items added when due; routine supplement questions only if listed in the profile
- [ ] Unit tests: "yes, headache" opens the headache follow-up and thigh-cuff question

### 5.2 Question components
- [ ] Number input with −/+ stepper, pre-filled from yesterday
- [ ] Blood pressure pair input
- [ ] Scale buttons: severity 0–3 and rating 1–5 with words/faces; tapping moves on automatically
- [ ] Yes/no and checklist (symptom tap list)
- [ ] Free-text note

### 5.3 Check-in page
- [ ] One question per screen with progress bar ("3 of 7"), Back, Skip, "Same as yesterday"
- [ ] Plausibility check for unlikely numbers (e.g. "45 °C? Please check the reading")
- [ ] Skip saves "not recorded" (never red)
- [ ] Draft saved if the user leaves mid-way; resume on return
- [ ] "How do I measure this?" opens overlay C

### 5.4 Summary screen
- [ ] Systems whose status changed, each with its first action and a link to System detail
- [ ] New tasks created (e.g. "Recheck temperature in 4–6 h"), also sent to the 🔔 list
- [ ] Check-in duration; "Back to Body Map" with pins animating to new colors

### 5.5 Overlay C — How to measure
- [ ] Reusable overlay: steps, tips, a common mistake, why it matters in space (from `systems.ts`)
- [ ] Keyboard: Esc closes; focus returns to the link

### 5.6 Overlay B — Log event
- [ ] Event type (spacewalk · landing/docking · gravity transition), time (default now), optional note
- [ ] Saving queues follow-ups: balance, motion sickness, dizziness, post-spacewalk dosimeter readout
- [ ] Upcoming landing queues pre-landing questions (fluid loading, compression garments)

### 5.7 Setup page (`/setup`)
- [ ] Step 1 Profile: display name, age, sex, height, preflight body mass, supplements/medications pick list
- [ ] Step 2 Preflight baselines with "Don't know" (falls back to the first 7 days)
- [ ] Step 3 Mission: profile, start date, length (pre-filled from the mission, editable)
- [ ] Every step skippable; Finish switches to the new profile and opens the Body Map
- [ ] Edit mode pre-fills the current profile; "Delete profile" with a confirmation step

**Done when:** a normal-day check-in takes about 2 minutes, answering "yes, headache" opens the right follow-up, and an out-of-range value turns the matching pin amber or red with guidance.

---

## Phase 6 — Routine and notifications (≈2 h)

### 6.1 Scheduler (`src/lib/scheduler.ts`)
- [ ] Generate tasks from the check-in tiers: daily core (morning), weekly items spread across the week
- [ ] Event-driven tasks (post-landing, post-spacewalk, pre-landing)
- [ ] Recheck tasks from amber/red actions (e.g. temperature in 4–6 h, BP within 1 h)
- [ ] Task states: due, overdue, done; skipped items return in the next prompt
- [ ] Priority order: red recheck → post-event → daily check-in → overdue weekly → weekly due today
- [ ] Unit tests

### 6.2 🔔 Notification dropdown
- [ ] Count badge; bell turns amber when overdue, red when a red recheck is due; no badge when empty
- [ ] Task list in priority order; tapping a task opens `/check-in?task=…`
- [ ] Empty state: "✓ All done for today · next: tomorrow 07:00"
- [ ] "See full routine →" link

### 6.3 Routine page (`/routine`)
- [ ] Today: due, overdue and done tasks, each opening the matching check-in
- [ ] This week: upcoming weekly tasks by day
- [ ] Completion count for the week
- [ ] Badges on the Check-in and Routine nav tabs

**Done when:** skipping a task shows it as overdue, completing it clears it, and the bell and Routine page always agree.

---

## Phase 7 — Onboarding, About, polish and submission (≈4 h)

### 7.1 About page (`/about`)
- [ ] How BodyMap works: status colors, check-in tiers, comms delay and guidance
- [ ] The 8 systems and 28 indicators with source type (direct / proxy / added)
- [ ] Sources (NASA HRP and CSA articles) and the disclaimer
- [ ] "Reset demo data" and "Take the tour again" buttons

### 7.2 Overlay A — Welcome
- [ ] 3 cards; "Explore demo crew" or "Set up my profile"
- [ ] Shown once on the first visit (flag in storage)

### 7.3 Overlay D — Guided tour
- [ ] Highlight box + tooltip component (dimmed background, "n of 6", Skip, Next)
- [ ] 6 steps: pins, one pin, daily check-in button, 🔔 bell, Log event, Mission ▾ ([site-map.md](site-map.md#overlays))
- [ ] Runs after Welcome on the first visit, using the demo crew; replay from About
- [ ] Keyboard: Esc skips, Enter goes to Next; tooltip readable by screen readers

### 7.4 First-time hints
- [ ] First check-in: "Tap an answer to move on. You can skip anything."
- [ ] First System detail: "Start with 'What to do now'. Details are below."

### 7.5 Accessibility and responsive pass
- [ ] Every status uses color + icon + word; check contrast against the [branding.md](branding.md) table
- [ ] Keyboard-only walk through every page and overlay; visible focus
- [ ] Labels for inputs, pins and buttons
- [ ] Test at phone, tablet and desktop widths

### 7.6 Release
- [ ] Final deploy; smoke-test every route and the demo story (Immune red → System detail → check-in → summary)
- [ ] README: "Getting started", "Tech stack" and "Architecture" sections
- [ ] Record the demo video
- [ ] Write the project submission following the Project Submission Guide

**Done when:** the project is submitted before Sun Nov 15, 11:59 p.m. local.

---

## Stretch (only if time remains)
- [ ] Gamification: streaks for completed tasks, badges, crew readiness score
- [ ] "Copy report" button on System detail and the check-in summary, for flight surgeons
- [ ] Simulated wearable feed updating heart rate and activity live
- [ ] Image upload for an eye/SANS self-check with guidance
