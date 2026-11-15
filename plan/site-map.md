# BodyMap: Crew Health — Site Map

The pages and overlays of the app, what each one shows, and how they connect. Content comes from [body-systems.md](body-systems.md); build order is in [tasks.md](tasks.md).

## Summary

**6 pages + 4 overlays.** We keep the page count small on purpose: the body map is home, and nearly everything is one tap from it.

| # | Page | Route | Purpose | Built in |
|---|---|---|---|---|
| 1 | Body Map (home) | `/` | See status at a glance and pick a system | Phase 3 |
| 2 | System detail | `/system/:id` | Indicators, trends, explanations and what to do | Phase 4 |
| 3 | Check-in | `/check-in` | Guided, tap-first daily / weekly check-in | Phase 5 |
| 4 | Routine | `/routine` | Today's due and overdue tasks, plus the week ahead | Phase 6 |
| 5 | Crew & mission setup | `/setup` | Profile, preflight baselines, mission profile and start date | Phase 5 |
| 6 | About | `/about` | How it works, sources, disclaimer | Phase 7 |

| Overlay | Opens from | Purpose |
|---|---|---|
| A. Welcome | First visit | Explain the app in 3 short cards; choose "Explore demo crew" or "Set up my profile" |
| B. Log event | Header button on every page | One tap to log a spacewalk, landing/docking or gravity transition, with an optional note |
| C. How to measure | "How do I measure this?" links | Steps and tips for one indicator, from `systems.ts` |
| D. Guided tour | After Welcome on first visit; "Take the tour again" on About | 6-step walkthrough of the home page |

Routes use hash routing (`/#/system/heart`) so the app works on GitHub Pages or Netlify without server config.

### System slugs

`:id` in `/system/:id` is the system's slug. The same slug is used as the system `id` in `systems.ts`, in check-in links (`/check-in?system=eyes`) and in saved data, so it must stay short, one word, and never change once data exists.

| System | Slug | URL |
|---|---|---|
| Heart & circulation | `heart` | `/#/system/heart` |
| Eyes & brain (SANS) | `eyes` | `/#/system/eyes` |
| Bones & muscles | `bones` | `/#/system/bones` |
| Immune system | `immune` | `/#/system/immune` |
| Metabolism & nutrition | `metabolism` | `/#/system/metabolism` |
| Mind & sleep | `mind` | `/#/system/mind` |
| Balance & orientation | `balance` | `/#/system/balance` |
| Radiation exposure | `radiation` | `/#/system/radiation` |

## Navigation

```
                ┌────────────── Header (every page) ──────────────┐
                │ BodyMap · Crew ▾ · Mission ▾ · 🔔 3 · [Log event] │
                └─────────────────────────────────────────────────┘
 Bottom nav (phone) / side nav (desktop):  Body Map · Check-in · Routine · About

 Welcome (first visit) ──► Body Map ◄──────────────┐
          │                  │  tap region          │
          └─► Setup          ▼                      │
                        System detail ──► Check-in (that system's items)
                                              │
 🔔 / Routine ── tap a due task ─────────────►│
                                              ▼
                                   Check-in summary ──► Body Map (updated)
```

- **Crew ▾** switches between saved profiles (the demo has 3 seeded crew).
- **Mission ▾** switches ISS / Artemis lunar / Mars transit. This changes escalation wording and radiation rates.
- **🔔 Notifications** lists pending tasks (see below).
- Setup is reached from Welcome, from the Crew menu ("Edit profile" / "Add crew member"), and from About ("Reset demo data").

### Notification bell

A bell in the header, on every page, lists the tasks the user should do. It replaces a "Today" bar on the home page, which would crowd the layout.

```
                                         🔔 3 ▾
                         ┌──────────────────────────────┐
                         │ ✖ Recheck temperature   now  │
                         │ ○ Daily check-in        due  │
                         │ ⚠ Vision check (weekly) late │
                         │ ──────────────────────────── │
                         │ See full routine →           │
                         └──────────────────────────────┘
```

- **Badge:** count of pending tasks. The bell turns amber when something is overdue and red when a red-system recheck is due. No badge when nothing is pending.
- **Order** (most important first):
  1. Recheck of a red system (e.g. "Recheck temperature in 4–6 h")
  2. Follow-up after a logged event (e.g. post-landing balance check, pre-landing questions)
  3. Daily check-in, if not done
  4. Overdue weekly tasks, then weekly tasks due today
- **Tap a task:** opens the matching check-in (`/check-in?task=…` or `?system=…`).
- **"See full routine →":** opens the Routine page with the week ahead.
- **Empty state:** "✓ All done for today · next: tomorrow 07:00".
- **Suggestions only:** nothing is forced or blocking; the user can do tasks in any order or skip them.
- **On phones:** the bell and Log event become icons, and mission and day fold into one short line under the header.

## Pages

### 1. Body Map (home) — `/`

The first thing judges and users see. Must answer "How am I doing?" in under 5 seconds.

- **Header:** crew member, mission profile, mission day out of mission length, with a progress bar, and comms delay (e.g. "Day 47 of 210 · Mars transit · 4 min comms delay")
- **Readiness summary:** counts of green / amber / red systems and one line on the most urgent item
- **Body figure (SVG) with callout pins:** a natural front-facing silhouette with faint organ hints inside. Each of the 8 systems is a labeled pin in one of two aligned columns, with a callout line to its organ, so pins are easy to tap even where body parts are close together (eyes, brain, inner ear). Full visual spec: [branding.md](branding.md#5-body-figure); approved look: [branding-sample.html](branding-sample.html)
  - Left column: Mind & sleep → brain · Eyes & brain (SANS) → eyes · Immune → lymph nodes (neck, armpits, groin) · Bones & muscles → spine and leg bones
  - Right column: Balance & orientation → inner ear · Heart & circulation → heart · Metabolism & nutrition → stomach · Radiation → ☢ gauge ring showing % of the mission dose budget, with a dashed line to the body (whole body)
  - **Status on each pin:** green / amber / red color, plus an icon (✓ / ⚠ / ✖), and a label with the reading and status word (e.g. "Immune · 38.2 °C · Act"), never color alone. Red pins pulse gently
  - **Organs light up:** amber and red organs glow in their status color, so the user sees where the problem is
  - **Hover** (desktop): tooltip with system, status and latest change (e.g. "Immune · Red · Fever 38.2 °C")
  - **Tap / click:** opens System detail (side panel on desktop, full page on phone)
  - **Linked to the system list:** hovering a list row highlights its pin, organ and line, and the reverse; other pins dim
  - **Keyboard:** Tab moves through pins, Enter opens them
  - **After a check-in:** pin colors change with a short transition so the user sees the effect of their answers
  - **On load:** one soft cyan scan line sweeps down the body (skipped when reduced motion is on)
  - **Phone:** pin labels show the name only; readings are in the system list
- **System list** beside the figure (or below it on phone): the same 8 systems as rows with status, latest change and a trend arrow. This is the keyboard and screen-reader path.
- **Daily check-in button:** a single "Start daily check-in (~2 min)" button, shown only until today's check-in is done. All other pending tasks are in the 🔔 dropdown
- **Alerts strip:** any red system, or an active solar particle event, with its first action

```
┌────────────────────────────────────────────────────────────┐
│ BodyMap  Cmdr. Vega ▾  Mars transit ▾  Day 47/210  🔔3 [Log]  │
├───────────────────────┬────────────────────────────────────┤
│ ✓ Mind ──╮  ╭── ✓ Bal │ 6 green · 1 amber · 1 red          │
│ ⚠ Eyes ──( o )        │ ⚠ Immune: fever 38.2 °C — see what │
│          /|♥|\─ ✓ Hrt │   to do                            │
│ ✖ Imm ──/ | \── ✓ Met │ ────────────────────────────────── │
│          /   \        │ ● Heart & circulation   ✓  →       │
│ ✓ Bones ─┘    └─ ◔ ☢  │ ● Eyes & brain          ⚠  ↗       │
│                       │ ● Immune                ✖  ↑       │
│                       │ …                                  │
│                       │                                    │
│                       │    [ Start daily check-in ~2 min ] │
└───────────────────────┴────────────────────────────────────┘
```

### 2. System detail — `/system/:id`

Opens when a pin or list row is tapped: a side panel sliding in from the right on desktop (over the Body Map, same route), a full page on phone. Everything comes from `systems.ts` and the user's data. Order: status → what to do → evidence → background.

Example: Immune system, red.

```
┌──────────────────────────────────────────┐
│ ✕  Immune system                 ✖ RED   │ 1. Status header
│    Fever with symptoms today              │
├──────────────────────────────────────────┤
│ WHAT TO DO NOW                            │ 2. Action + escalation
│ • Run the onboard infection protocol      │
│ • Consider isolating from the crew        │
│ ▸ Mars transit (8 min delay): start the   │
│   protocol first; the CMO leads care;     │
│   send a report to flight surgeons        │
├──────────────────────────────────────────┤
│ INDICATORS                                │ 3. Indicator cards
│ ┌ Body temperature ──────── ✖ 38.2 °C ┐   │
│ │ +1.1 °C vs baseline · today 07:10   │   │
│ └─────────────────────────────────────┘   │
│ ┌ Symptoms ──────────── ✖ cold sore,  ┐   │
│ │                        sore throat  │   │
│ └─────────────────────────────────────┘   │
├──────────────────────────────────────────┤
│ TRENDS     [7 d] [30 d] [Mission]         │ 4. Trend charts
│ 38 ┤ ░░░░░░░░░░░░░░░░░░ red ░░░░░░  ●      │
│ 37 ┤ ▒▒▒▒▒▒▒▒▒ amber ▒▒▒▒▒▒▒▒▒▒▒▒▒/       │
│ 36 ┤ ──●──●──●──●──●──●──●──●─╯   green    │
│     ▲ EVA      ▲ pain reliever            │
├──────────────────────────────────────────┤
│ ▸ Why this changes in space               │ 5. Explanation
│ ▸ How to measure                          │ 6. Measurement help
│ ▸ Sources (4 articles)                    │ 7. Sources
├──────────────────────────────────────────┤
│        [ Check this system now ]          │ 8. Action button
└──────────────────────────────────────────┘
```

1. **Status header:** system name, status (color + icon + word), and one plain sentence on why, taken from the indicator driving the status. ✕ closes the panel.
2. **What to do now:** the actions for the current status, then the escalation line worded for the selected mission and current comms delay ([Escalation by mission](body-systems.md#escalation-by-mission)). On ISS, for example: "Call flight surgeons now". When green, this shrinks to "Keep your routine" plus one prevention tip.
3. **Indicator cards:** one per indicator, showing latest value, status, change vs preflight baseline and when recorded. Shows "Not recorded" if skipped. Amber and red cards come first.
4. **Trend charts** (Recharts): one small chart per indicator, with 7 days / 30 days / whole mission buttons. Green/amber/red bands and a dashed baseline line. Event markers (spacewalk, landing) and countermeasure markers (thigh cuffs, medication) help explain changes.
5. **Why this changes in space** (collapsed): short, plain explanation drawn from the articles.
6. **How to measure** (collapsed): steps for each indicator; same content as overlay C.
7. **Sources** (collapsed): the articles behind this system, linked to their original pages.
8. **Check this system now:** opens Check-in with only this system's questions (`/check-in?system=<id>`).

**Design choices**
- **Action before data:** the challenge asks what astronauts should do, so guidance comes before charts.
- **Background collapsed:** a quick check fits on one screen, and details are one tap away.
- **One layout for all 8 systems:** only the content changes. One component to build, and one layout to learn.

### 3. Check-in — `/check-in`

Where the user enters health data: one question per screen, tap-first, about 2 minutes on a normal day ([Check-in design](body-systems.md#check-in-design-fast-low-effort)).

**Ways in**

| Started from | Asks | Link |
|---|---|---|
| "Start daily check-in" button or Check-in tab | The full daily check-in | `/check-in` |
| "Check this system now" in System detail | Only that system's questions | `/check-in?system=eyes` |
| A task in the 🔔 dropdown or on Routine | Only that task | `/check-in?task=vision-weekly` |

**Flow**

1. **Daily core (7):** blood pressure, heart rate, temperature, sleep hours, mood, exercise minutes, "Any symptoms today?"
2. **Follow-ups (only if triggered):** symptoms = yes → symptom tap list; low mood → stress and sleep quality; amber/red reading → rest of that system's questions
3. **Countermeasure questions (only if triggered):** e.g. motion sickness medicine after dizziness
4. **Weekly items (only if due today):** e.g. vision chart, body mass
5. **Note (optional):** one free-text box
6. **Summary**

On a good day: 7 questions, then the summary.

**Question screen**

```
┌──────────────────────────────────────────┐
│ ← Back      Daily check-in      3 of 7   │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░                │
│                                          │
│   What's your body temperature?          │
│                                          │
│          [ − ]   36.6 °C   [ + ]         │
│          (yesterday: 36.6)               │
│                                          │
│   How do I measure this?                 │
│                                          │
│   [ Same as yesterday ]   [  Next  ]     │
│                  Skip                    │
└──────────────────────────────────────────┘
```

Scale questions use big buttons:

```
   How is your mood today?
   [😞 Bad] [🙁 Low] [😐 OK] [🙂 Good] [😄 Great]
```

**What makes it fast**
- **One plain question per screen**, with a progress bar ("3 of 7")
- **Numbers pre-filled** with yesterday's value and −/+ steppers; an unchanged reading is one tap
- **"Same as yesterday"** confirms and moves on
- **Tapping a scale answer** moves to the next question automatically
- **Skip** always allowed; the item shows as "not recorded", not red
- **"How do I measure this?"** opens overlay C only when tapped
- **Back** changes an earlier answer
- **Plausibility check** for unlikely numbers (e.g. "45 °C? Please check the reading")
- **Progress saved** if the user leaves mid-way

**Summary screen (last step)**

```
┌──────────────────────────────────────────┐
│ ✓ Check-in complete · 1 min 48 s         │
│                                          │
│ Changes                                  │
│ ✖ Immune → RED   Temperature 38.2 °C     │
│   → Run the onboard infection protocol   │
│     [ See what to do ]                   │
│ ✓ All other systems unchanged            │
│                                          │
│ Next: Recheck temperature in 4–6 h 🔔    │
│                                          │
│          [ Back to Body Map ]            │
└──────────────────────────────────────────┘
```

- **Changes:** any system whose status changed, its first action and a link to its System detail
- **Next:** any new task (e.g. a recheck), also added to the 🔔 dropdown
- **Back to Body Map:** pins update with a short transition so the user sees the effect of their answers

### 4. Routine — `/routine`

The mission routine as a checklist.

- **Today:** due and overdue tasks (morning vitals, weekly items due today, post-event checks). Each task opens the matching check-in
- **This week:** upcoming weekly tasks by day
- **Streak / completion:** simple count of tasks completed this week (stretch: gamification badges)

### 5. Crew & mission setup — `/setup`

A short form in 3 steps, each one skippable. Optional for the demo.

1. **Profile:** display name, age, sex, height, preflight body mass, regular supplements / medications
2. **Preflight baselines:** resting BP and heart rate, strength test, near-vision score, balance time, typical sleep hours. "Don't know" → use the first 7 days of check-ins
3. **Mission:** mission profile, start date and mission length (pre-filled from the profile, editable)

Also hosts "Add crew member" and "Edit profile".

### 6. About — `/about`

For first-time users and judges.

- **How BodyMap works:** the status colors, check-in tiers, and how comms delay changes guidance
- **The 8 body systems and 28 indicators:** short list with source type (direct / proxy / added), from [health-indicators.md](health-indicators.md)
- **Sources:** NASA Human Research Program and CSA articles
- **Disclaimer:** demo software; thresholds are illustrative, not medical advice
- **Reset demo data** button
- **Take the tour again** button (replays overlay D)

## Overlays

- **A. Welcome:** 3 cards ("Tap a system, see your status" · "A 2-minute daily check-in" · "Guidance that adapts to your distance from Earth"), then "Explore demo crew" or "Set up my profile". Shown once; reopen from About.
- **B. Log event:** event type (spacewalk · landing/docking · gravity transition), time (default now), optional note. Saving it queues the matching follow-ups (balance, motion sickness, dosimeter readout, pre-landing questions) in the 🔔 dropdown and on the Routine page.
- **C. How to measure:** steps, tips, a common mistake, and why the measurement matters in space, for one indicator.
- **D. Guided tour:** starts right after Welcome on the first visit. The screen dims, one element is highlighted at a time, and a small tooltip explains it with Next / Skip and "n of 6".

  | Step | Highlights | Tooltip |
  |---|---|---|
  | 1 | Body figure pins | "Each pin is a body system. The color shows its status: green, amber or red." |
  | 2 | One pin (e.g. Immune) | "Tap a pin to see readings, trends and what to do." |
  | 3 | Start daily check-in button | "Your 2-minute daily check-in. Most answers are one tap." |
  | 4 | 🔔 Bell | "Pending tasks appear here, most important first." |
  | 5 | Log event | "Log a spacewalk or landing. The app will ask the right follow-up checks." |
  | 6 | Mission ▾ | "Switch missions to see how guidance changes with distance from Earth." |

  ```
  ┌───────────────────────────────────────────────┐
  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ┌──────┐ ░░│
  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ 🔔 3 │ ░░│
  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ └──┬───┘ ░░│
  │░░░░░░░░░░░░░░░░░░░░░ ┌───────────────┴───┐ ░░│
  │░░░░░░░░░░░░░░░░░░░░░ │ Pending tasks     │ ░░│
  │░░░░░░░░░░░░░░░░░░░░░ │ appear here.      │ ░░│
  │░░░░░░░░░░░░░░░░░░░░░ │ 4 of 6  Skip Next │ ░░│
  │░░░░░░░░░░░░░░░░░░░░░ └───────────────────┘ ░░│
  └───────────────────────────────────────────────┘
  ```

  - **Skippable** at any step; shown only on the first visit; replay from About
  - **Uses the demo crew** so pins show real colors, including amber and red
  - **Accessible:** Esc skips, Enter goes to Next; tooltip text is readable by screen readers
  - **First-time hints** (shown once each, no tour): first check-in — "Tap an answer to move on. You can skip anything."; first System detail — "Start with 'What to do now'. Details are below."
  - **Build:** a small custom component (highlight box + tooltip), no library

## Not separate pages (and why)

| Idea | Where it lives instead |
|---|---|
| Dashboard of all charts | Each System detail has its own charts; the Body Map is the overview |
| Alerts / notifications page | 🔔 dropdown in the header for pending tasks; alerts strip on the Body Map for red systems; full list on Routine |
| Report to flight surgeons | Stretch: a "Copy report" button on System detail and the check-in summary |
| Login / account | Not needed: data is stored in the browser |
| Settings | Crew menu (edit profile) and About (reset data) cover it |

## Layout notes

- **Phone first:** single column, bottom nav, the body figure above the system list
- **Desktop:** body figure and system list side by side; System detail as a side panel
- **Accessibility:** every status uses color + icon + text; the system list gives a non-visual path to everything on the figure; all check-in buttons work with a keyboard
