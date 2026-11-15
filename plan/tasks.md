# BodyMap: Crew Health — Tasks

Task checklist for each phase in [roadmap.md](roadmap.md). Tick items off as they're done.

## Phase 0 — Setup (≈1 h)
- [ ] Scaffold Vite + React + TypeScript; add Tailwind and Recharts
- [ ] Folders: `src/data` (systems, missions), `src/lib` (status rules, seed generator, storage), `src/components`
- [ ] Choose deploy target (GitHub Pages or Netlify) and do a first "hello" deploy

**Done when:** an empty app builds and is live at a public URL.

## Phase 1 — Health model (≈3 h)
- [ ] `src/data/systems.ts`: 8 systems, each with indicators (name, unit, input type, normal/amber/red thresholds), "why this changes in space", "how to measure", actions per status, and article references
- [ ] `src/data/missions.ts`: 3 profiles (comms delay, radiation rate, resupply, escalation wording)
- [ ] `src/lib/status.ts`: indicator → green/amber/red; system status = worst of its indicators

**Done when:** a quick unit check scores sample readings into the expected colors.

## Phase 2 — Seed data (≈2 h)
- [ ] Deterministic generator: 3 crew members × 90 days per mission profile
- [ ] Encode article trends: bone density −1–1.5%/month; strength and aerobic fitness −10–12% by mission end; neutron dose ~150 µSv/day on ISS, scaled up for lunar/Mars; sleep disruption; gradual SANS onset in one crew member; one immune episode (cold sore/fever) for a demo alert
- [ ] `localStorage` persistence with a "reset demo data" action

**Done when:** each crew member/mission shows a believable mix of green, amber and at least one red.

## Phase 3 — Body map (≈4 h)
- [ ] SVG human figure with clickable regions: heart, head/eyes, skeleton/muscles, immune (lymph/torso), gut, brain/mind, inner ear, whole-body radiation badge
- [ ] Status colors plus icon/label (not color alone), hover tooltips
- [ ] Crew-member and mission switchers; overall readiness summary

**Done when:** clicking any region selects that system, and colors reflect the seeded data.

## Phase 4 — System detail panel (≈4 h)
- [ ] Indicator cards with latest value and status
- [ ] Recharts trend per indicator with threshold bands
- [ ] "Why this changes in space" and "How to measure" sections
- [ ] Action and escalation guidance, worded per mission comms delay

**Done when:** every system's panel is filled entirely from `systems.ts` with no hard-coded text in components.

## Phase 5 — Check-in flow (≈3 h)
- [ ] Guided daily form: BP, HR, glucose, temperature, sleep hours, mood, symptoms
- [ ] Inline "how to measure" help and input validation (units, plausible ranges)
- [ ] Submitting re-scores the body map instantly

**Done when:** entering an out-of-range value turns the matching body region amber or red and shows guidance.

## Phase 6 — Scheduled prompts (≈2 h)
- [ ] Mission routine: morning vitals (daily), fitness self-test (weekly), dosimeter readout (weekly), vision check (weekly)
- [ ] Due / overdue list with a link into the right check-in

**Done when:** skipping a task shows it as overdue, and completing it clears it.

## Phase 7 — Polish & submission (≈4 h)
- [ ] First-run explainer / onboarding
- [ ] Accessibility pass (contrast, keyboard navigation, labels) and responsive layout
- [ ] Final deploy; update README with "Getting started" and "Tech stack"
- [ ] Record the demo video; write the project submission following the Project Submission Guide

**Done when:** the project is submitted before Sun Nov 15, 11:59 p.m. local.

## Stretch (only if time remains)
- [ ] Gamification: streaks for completed prompts, badges, crew readiness score
- [ ] Simulated wearable feed updating heart rate and activity live
- [ ] Image upload for an eye/SANS self-check with guidance
