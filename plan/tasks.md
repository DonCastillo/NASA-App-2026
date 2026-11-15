# BodyMap: Crew Health — Tasks

Task checklist for each phase in [roadmap.md](roadmap.md). Pages and routes are in [site-map.md](site-map.md). Tick items off as they're done.

## Phase 0 — Setup (≈1 h)
- [ ] Scaffold Vite + React + TypeScript; add Tailwind and Recharts
- [ ] Folders: `src/data` (systems, missions), `src/lib` (status rules, seed generator, storage), `src/components`
- [ ] Choose deploy target (GitHub Pages or Netlify) and do a first "hello" deploy

**Done when:** an empty app builds and is live at a public URL.

## Phase 1 — Health model (≈3 h)
- [ ] `src/data/systems.ts`: 8 systems, each with indicators (name, unit, input type, normal/amber/red thresholds), "why this changes in space", "how to measure", actions per status, and article references
- [ ] `src/data/missions.ts`: 3 profiles (default length 180 / 30 / 210 days, comms delay — growing by mission day on Mars transit — radiation rate, resupply, escalation wording)
- [ ] `src/lib/status.ts`: indicator → green/amber/red; system status = worst of its indicators

**Done when:** a quick unit check scores sample readings into the expected colors.

## Phase 2 — Seed data (≈2 h)
- [ ] Deterministic generator: 3 crew members per mission profile, with daily history from day 1 up to a set "current" day within the mission length (e.g. ISS day 120 of 180, Artemis day 20 of 30, Mars day 150 of 210)
- [ ] Encode article trends: bone density −1–1.5%/month; strength and aerobic fitness −10–12% by mission end; neutron dose ~150 µSv/day on ISS, scaled up for lunar/Mars; sleep disruption; gradual SANS onset in one crew member; one immune episode (cold sore/fever) for a demo alert
- [ ] Seeded crew profiles (name, age, sex, height, preflight body mass, regular supplements/medications) and preflight baselines; built-in radiation budget per mission in `missions.ts`
- [ ] `localStorage` persistence with a "reset demo data" action

**Done when:** each crew member/mission shows a believable mix of green, amber and at least one red.

## Phase 3 — Body map (≈4 h)
- [ ] SVG human figure with 8 callout pins (eyes, top of head, ear, heart, torso/lymph, abdomen, spine/hips/legs, ☢ radiation badge) — see [site-map.md](site-map.md#1-body-map-home--)
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
- [ ] Profile & mission setup screen (optional for demo): profile fields, preflight baselines (fall back to first 7 days), mission profile, start date and mission length (pre-filled, editable) — see [body-systems.md](body-systems.md#user-profile--context)
- [ ] "Log event" (spacewalk, landing/docking, gravity transition), countermeasure/medication questions (triggered, routine and pre-landing — see [body-systems.md](body-systems.md#countermeasure-and-medication-questions)), and a free-text note on check-ins
- [ ] Tier 1 daily core screen (7 items) with pre-filled values, −/+ steppers and "Same as yesterday"
- [ ] Tap-to-answer scale buttons (severity 0–3, rating 1–5 with words/faces)
- [ ] Follow-up rules from [body-systems.md](body-systems.md#triggers-for-follow-ups): symptom tap list, mood/sleep/temperature/amber triggers
- [ ] Weekly items (tier 3) and automatic values (tier 4: bone-loss estimate, dose rate)
- [ ] "How do I measure this?" help on demand; validation for plausible ranges; skip = "not recorded"
- [ ] Submitting re-scores the body map instantly and shows the next action for any amber/red system

**Done when:** a normal-day check-in takes about 2 minutes, answering "yes, headache" opens the right follow-up, and an out-of-range value turns the matching body region amber or red with guidance.

## Phase 6 — Scheduled prompts (≈2 h)
- [ ] Mission routine from the check-in tiers: daily core (morning), weekly items spread across the week, event-driven prompts after gravity transitions or spacewalks
- [ ] Due / overdue list with a link into the right check-in step
- [ ] Header 🔔 notification dropdown: pending tasks in priority order, count badge, empty state, "See full routine" link — see [site-map.md](site-map.md#notification-bell)
- [ ] Skipped items return in the next prompt

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
