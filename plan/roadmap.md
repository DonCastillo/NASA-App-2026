# BodyMap: Crew Health — Roadmap

## Goal

Build a visual self-assessment tool that lets astronauts gather health indicators, see their status at a glance, and know what to do next. This answers the challenge's core asks ([challenge-statement.md](challenge-statement.md)):

| Challenge objective | BodyMap feature |
|---|---|
| Visual tool to assess own health | Interactive body map, color-coded per body system |
| Gather indicators (BP, HR, glucose, temp, sleep, mood…) | Guided daily check-in + seeded mission history |
| Explain measurements and risks; don't assume expertise | "How to measure" and "Why this changes in space" on every indicator |
| When does a result need crew or flight-surgeon attention? | Green/amber/red rules + escalation guidance adjusted for comms delay |
| Show change over time; color coding at a glance | Trend charts with threshold bands |
| Prompt measurements as part of the mission routine | Scheduled prompts with due/overdue list |
| Different environments (station, spacecraft, base) | Switchable mission profile: ISS, Artemis lunar, Mars transit |

## Decisions

- **Team:** solo
- **Stack:** Vite + React + TypeScript, Tailwind CSS, Recharts, React Router (hash routing), Zustand (state), date-fns (dates), lucide-react (icons), Vitest (tests). Client-only; data in `localStorage`, no backend.
- **Data input:** manual guided check-ins + deterministic seeded crew histories.
- **UI theme:** mission-control dark, calm and precise; see [branding.md](branding.md).
- **Disclaimer:** thresholds and guidance are illustrative demo values, not medical advice.

## Scope

**Must-have**
- Interactive body map with per-system status
- System detail panel: indicators, trend charts, explanations, actions
- Green/amber/red status rules per indicator and per system
- Escalation guidance that changes with mission comms delay
- Guided daily check-in
- Scheduled prompts (mission routine)
- Mission switcher (ISS / Artemis lunar / Mars transit) and crew-member switcher

**Stretch (only if ahead of schedule)**
- Gamification: streaks, badges, crew readiness score
- Simulated wearable stream (Bio-Monitor–style live HR/activity/sleep)
- Image upload for an eye/SANS check

## How we start: content first, then UI

The app's value is the mapping **body system → indicators → why it changes in space → thresholds → actions**. Build that as typed data first, sourced from [plan/articles/](articles/), and make every screen render from it. Then the UI is mostly presentation, and content fixes never require component changes.

### Body-system model

Summary below. The full model — what each system does, how spaceflight affects it, every indicator with unit, how to measure, frequency, green/amber/red thresholds, actions, and escalation by mission — is in [body-systems.md](body-systems.md). The source of each indicator is listed in [health-indicators.md](health-indicators.md). The pages of the app are planned in [site-map.md](site-map.md).

| System | Indicators (input) | Key sources in `plan/articles/` |
|---|---|---|
| Heart & circulation | Blood pressure, resting heart rate | risk-of-cardiovascular-adaptations, venous-haemostasis, thigh-cuff |
| Eyes & brain (SANS) | Vision self-check, headache | risk-of-spaceflight-associated-neuro-ocular-syndrome-sans, b-complex, brain-fluid-pressure, spinal-fluid-biomarkers |
| Bones & muscles | Weekly fitness self-test, exercise minutes, estimated bone loss | risk-of-spaceflight-induced-bone-changes, risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness, astronauts-spines-under-scrutiny, zero-t2 |
| Immune | Body temperature, symptoms (cold sores, rash, infection) | risk-of-altered-immune-system-responses, risk-of-host-microorganism-interactions, immune-biomarkers, scientists-probe-how-long-term-spaceflight-alters-immunity |
| Metabolism & nutrition | Blood glucose, body mass, appetite / menu fatigue | risk-of-inadequate-food-and-nutrition, how-does-spaceflight-change-food-appeal, enhanced-diet-may-help-astronauts-adapt-to-spaceflight |
| Mind & sleep | Mood, stress, sleep hours | risk-of-behavioral-changes-and-psychiatric-disorders, risk-from-inadequate-sleep-and-irregular-schedules, risk-of-inadequate-teamwork, can-space-gardening-help-astronauts-cope-with-isolation |
| Balance & orientation | Motion sickness, dizziness | risk-of-altered-sensorimotor-and-vestibular-function, simulating-manual-piloting-for-moon-landings |
| Radiation | Cumulative dose (dosimeter readout) | risk-of-radiation-induced-cancers, monitoring-radiation-for-astronaut-health, radi-n2-tracking-space-radiation-and-its-risks, little-transistor-records-radiation-levels |

### Mission profiles

| Profile | Default length | Comms delay (one way) | Environment notes |
|---|---|---|---|
| ISS | 180 days | Near real time | Inside Earth's magnetosphere; resupply available |
| Artemis lunar | 30 days | ~1.3 s | Outside the magnetosphere; gravity transitions (landing, spacewalks) |
| Mars transit | 210 days (one way) | Grows with distance, from ~0 at departure to ~20 min at arrival | No resupply; highest radiation; crew must act autonomously |

The mission profile fills in a **default length**, which the user can change in setup (e.g. a 1-year ISS mission). With the start date, this gives "Day 47 of 180", a progress bar, end-of-mission projections (bone loss, radiation dose) and, on Mars transit, the current comms delay.

*Default lengths and the Mars delay curve are illustrative demo values. ISS missions in the articles run four to six months (CIPHER covers up to a year); the Moon and Mars figures are general spaceflight knowledge, not from the articles.*

Each profile changes radiation accrual in the seeded data and the wording of escalation guidance (e.g. "call flight surgeon now" on ISS vs "follow onboard protocol, then send report" on Mars transit).

## Phases

Time boxes assume the hackathon window: Sat Nov 14 afternoon → Sun Nov 15, 11:59 p.m. local (≈30 working hours including breaks). The task checklist for each phase is in [tasks.md](tasks.md).

| Phase | Time | Outcome |
|---|---|---|
| 0 — Setup | ≈1 h | Empty app builds and is live at a public URL |
| 1 — Health model | ≈3 h | `systems.ts`, `missions.ts` and status rules score sample readings correctly |
| 2 — Seed data | ≈2 h | 3 crew per mission, with history up to a set day within the mission length, with a believable mix of green, amber and red |
| 3 — Body map | ≈4 h | Clickable SVG figure colored from the data; crew and mission switchers |
| 4 — System detail panel | ≈4 h | Indicators, trend charts, explanations and comms-delay-aware guidance, all from `systems.ts` |
| 5 — Check-in flow | ≈3 h | Out-of-range input turns the matching region amber/red and shows guidance |
| 6 — Scheduled prompts | ≈2 h | Mission routine with due/overdue tasks |
| 7 — Polish & submission | ≈4 h | Accessible, deployed, demo video recorded, project submitted |
| Stretch | if time | Gamification, simulated wearable feed, eye/SANS image upload |

## Risks and cuts

If behind schedule, cut in this order:
1. Stretch features
2. Scheduled prompts (keep a static "today's routine" list)
3. Check-in polish (keep a basic form)
4. Mission-specific seed variations (keep one dataset; switch only the guidance wording)

Never cut: body map, detail panel with status and guidance, and the submission itself.

## Key dates

From the 2026 organizer messages in [plan/messages/](messages/):

- **Sat Nov 14, 9:00 a.m. local:** hackathon starts (no project work before this)
- **Sun Nov 15, 11:59 p.m. local:** hackathon ends; Local Event registration closes
- Stay registered at a Local Event; a 1-person team is eligible for Local Event global judging
- Help: Space Apps Connect, Participant FAQs, Project Submission Guide, Judging and Awards Guide
