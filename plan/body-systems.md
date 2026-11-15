# BodyMap: Crew Health — Body-System Model

The content model behind the app. Each body system lists what it does, how spaceflight affects it, the indicators the crew records, thresholds for green / amber / red, and what to do at each status. Phase 1 turns this file into `src/data/systems.ts` (see [tasks.md](tasks.md)).

**About the thresholds.** Spaceflight facts come from the articles in [articles/](articles/). Most numeric thresholds are general adult reference ranges or demo values chosen for the app. They are marked *illustrative* and are not medical advice. For where each of the 28 indicators comes from (direct, proxy or added), see [health-indicators.md](health-indicators.md).

**Status rules**
- Each indicator scores green, amber or red.
- A system takes the worst status of its indicators.
- A trend rule can also raise amber. Example: three amber readings in a row, or a steady drift toward a threshold.
- **Green** means keep the routine. **Amber** means self-care and recheck, and tell the crew medical officer (CMO). **Red** means follow the onboard protocol and escalate to flight surgeons. Mission profiles change how escalation is worded (see [Escalation by mission](#escalation-by-mission)).

---

## 1. Heart & circulation

**Body map region:** chest / heart

**What it does:** pumps blood and keeps blood pressure steady when posture or gravity changes.

**How spaceflight affects it**
- In weightlessness, fluids shift toward the head.
- The heart and blood vessels adapt, and the heart can become more spherical.
- Risks include arrhythmias, blood clots (from altered venous flow in the neck) and low blood pressure that can cause fainting at landing.

**Indicators**

| Indicator | Unit / input | How to measure | When | Green | Amber | Red |
|---|---|---|---|---|---|---|
| Blood pressure (systolic/diastolic) | mmHg, number pair | Cuff on upper arm, seated and still for 5 min, before exercise | Daily (morning) | 90–129 / 60–84 | 130–139 / 85–89, or 85–89 systolic | ≥140 / ≥90, or <85 systolic |
| Resting heart rate | bpm, number | Wearable or 60-second pulse count on waking | Daily (morning) | 50–90 | 91–100 or 45–49 | >100 or <45 |
| Irregular heartbeat / palpitations | yes/no + note | Self-report | Daily check-in | No | Brief, once | Repeated, or with dizziness or chest pain |
| Neck or arm swelling / pain | yes/no | Self-report (possible clot sign) | Daily check-in | No | — | Yes |

*Thresholds are illustrative.*

**Actions**
- **Green:** keep exercising and eating the planned diet.
- **Amber:** recheck within 1 hour. Hydrate and log any caffeine or exercise taken before the reading.
- **Red:** stop strenuous work, run the onboard cardiac protocol and escalate.
- **Before landing:** fluid loading and lower-body compression garments.

**Sources:** risk-of-cardiovascular-adaptations, venous-haemostasis, thigh-cuff, cipher

---

## 2. Eyes & brain (SANS)

**Body map region:** head / eyes

**What it does:** vision, and the pressure balance of fluid around the brain and optic nerve.

**How spaceflight affects it**
- Fluid shifting toward the head can cause spaceflight associated neuro-ocular syndrome (SANS).
- Its signs are optic nerve swelling, retinal folds and a flattened back of the eye.
- About 70% of ISS astronauts show some swelling at the back of the eye, and the risk grows with mission length.

**Indicators**

| Indicator | Unit / input | How to measure | When | Green | Amber | Red |
|---|---|---|---|---|---|---|
| Near-vision self-check | lines read on a chart, number | Read a standard near-vision card at a fixed distance, each eye | Weekly | Same as baseline | 1 line worse | ≥2 lines worse, or sudden change |
| Blurred or distorted vision | 0–3 scale | Self-report | Daily check-in | 0 | 1 | 2–3 |
| Headache | 0–3 severity (none, mild, moderate, severe) | Self-report | Follow-up (symptoms = yes) | 0 | 1 | 2–3, or any headache with vision change |

*Thresholds are illustrative.*

**Actions**
- **Green:** routine weekly check.
- **Amber:** recheck the next day and log the use of fluid-shift countermeasures, such as thigh cuffs if available.
- **Red:** request an eye exam (onboard ultrasound or imaging) and escalate.

**Sources:** risk-of-spaceflight-associated-neuro-ocular-syndrome-sans, brain-fluid-pressure, spinal-fluid-biomarkers, b-complex, thigh-cuff

---

## 3. Bones & muscles

**Body map region:** skeleton / limbs / spine

**What it does:** supports the body, allows movement and carries loads (including a spacesuit).

**How spaceflight affects it**
- Weight-bearing bones (spine, hips) lose about 1–1.5% of their density per month without countermeasures.
- On average, crews lose 10–12% of their strength and aerobic fitness, and 12–38% of crew members lose more than 20%.
- The spine lengthens by up to 3%.
- The risk of falls and injury rises at gravity transitions.

**Indicators**

| Indicator | Unit / input | How to measure | When | Green | Amber | Red |
|---|---|---|---|---|---|---|
| Exercise completed | minutes/day, number | Log from exercise device | Daily | ≥90 | 60–89 | <60 for 3+ days |
| Fitness self-test (strength) | % of preflight baseline | Standard set on the resistive device | Weekly | ≥90% | 80–89% | <80% |
| Estimated bone loss | % from baseline (model) | Calculated from mission days and exercise compliance | Weekly (auto) | <3% | 3–5% | >5% |
| Back pain | 0–3 severity | Self-report | Follow-up (symptoms = yes) | 0 | 1–2 | 3 |

*Thresholds are illustrative. ISS crews exercise about 1.5 h a day.*

**Actions**
- **Green:** keep exercising about 1.5 h a day, 6–7 days a week.
- **Amber:** add resistive sessions and check equipment and form.
- **Red:** have the CMO review the exercise plan and escalate. Take extra care before spacewalks or landing.

**Sources:** risk-of-spaceflight-induced-bone-changes, risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness, astronauts-spines-under-scrutiny, zero-t2, risk-of-injury-from-dynamic-loads

---

## 4. Immune system

**Body map region:** torso / lymph nodes

**What it does:** defends against infection and keeps dormant viruses in check.

**How spaceflight affects it**
- Radiation, microgravity, stress and poor sleep weaken immune responses.
- Dormant viruses can reactivate, causing cold sores or shingles.
- Crew members have reported rashes, atypical allergies and infections.
- Microbes on the body and in the closed habitat change, and some become more virulent.

**Indicators**

| Indicator | Unit / input | How to measure | When | Green | Amber | Red |
|---|---|---|---|---|---|---|
| Body temperature | °C, number | Oral or forehead thermometer, at rest | Daily (morning) | 36.1–37.2 | 37.3–37.9 | ≥38.0 or <35.5 |
| Symptoms | checklist: cold sore, rash, sore throat, cough, wound not healing, allergy | Self-report | Daily check-in | None | 1 mild symptom | Fever with symptoms, spreading rash, or 2+ symptoms |

*Thresholds are illustrative.*

**Actions**
- **Green:** follow hygiene routines and sleep well.
- **Amber:** recheck temperature in 4–6 h, follow hygiene and isolation basics and tell the CMO.
- **Red:** run the onboard infection protocol, consider isolating from the crew and escalate.

**Sources:** risk-of-altered-immune-system-responses, risk-of-host-microorganism-interactions, immune-biomarkers, scientists-probe-how-long-term-spaceflight-alters-immunity

---

## 5. Metabolism & nutrition

**Body map region:** abdomen / gut

**What it does:** turns food into energy and nutrients and keeps blood sugar and body mass stable.

**How spaceflight affects it**
- Months of the same foods cause menu fatigue, which lowers appetite and can lead to body mass loss and nutritional deficiencies.
- There is no resupply on long missions.
- An enhanced diet (fruits, vegetables, fish) is being studied for immune and gut health.

**Indicators**

| Indicator | Unit / input | How to measure | When | Green | Amber | Red |
|---|---|---|---|---|---|---|
| Blood glucose (fasting) | mg/dL, number | Finger-stick meter before breakfast | Daily or 3×/week | 70–99 | 100–125, or 55–69 | ≥126, or <55 |
| Body mass | % change from preflight | Body mass measurement device | Weekly | within ±2% | −2 to −5% | below −5% |
| Appetite / food enjoyment | 1–5 scale | Self-report | Daily check-in | 4–5 | 3 | 1–2 for 3+ days |
| Meals completed | % of planned intake | Self-report | Daily check-in | ≥90% | 75–89% | <75% |

*Thresholds are illustrative.*

**Actions**
- **Green:** eat a varied menu.
- **Amber:** swap in preferred foods or "bonus" items, and treat low glucose with fast sugar, then recheck in 15 min.
- **Red:** the CMO reviews intake, and you escalate.

**Sources:** risk-of-inadequate-food-and-nutrition, how-does-spaceflight-change-food-appeal, enhanced-diet-may-help-astronauts-adapt-to-spaceflight

---

## 6. Mind & sleep

**Body map region:** brain (mind)

**What it does:** mood, focus, decision-making and teamwork, restored by sleep.

**How spaceflight affects it**
- Isolation and confinement raise the risk of anxiety and depression.
- Irregular light cycles (16 sunrises a day on the ISS) and workload disrupt sleep.
- Comms delays limit support from family and professionals.
- Small spaces strain teamwork.

**Indicators**

| Indicator | Unit / input | How to measure | When | Green | Amber | Red |
|---|---|---|---|---|---|---|
| Sleep duration | hours, number | Wearable/actigraphy or self-report | Daily (morning) | ≥7 | 6–6.9 | <6, or <6 for 3+ nights |
| Sleep quality | 1–5 scale | Self-report | Daily (morning) | 4–5 | 3 | 1–2 |
| Mood | 1–5 scale | Self-report | Daily check-in | 4–5 | 3 | 1–2, or low for 3+ days |
| Stress | 1–5 scale | Self-report | Daily check-in | 1–2 | 3 | 4–5 |
| Crew relations | 1–5 scale | Self-report | Weekly | 4–5 | 3 | 1–2 |

*Thresholds are illustrative.*

**Actions**
- **Green:** keep scheduled relaxation and self-care.
- **Amber:** protect the sleep window, use lighting cues, limit caffeine late in the day, journal, tend plants and talk to the crew.
- **Red:** get CMO support and a private conference with a psychologist (delayed messages on Mars), and adjust the schedule.

**Sources:** risk-of-behavioral-changes-and-psychiatric-disorders, risk-from-inadequate-sleep-and-irregular-schedules, risk-of-inadequate-teamwork, can-space-gardening-help-astronauts-cope-with-isolation, archer

---

## 7. Balance & orientation

**Body map region:** inner ear

**What it does:** senses motion and orientation and coordinates eyes, head and body.

**How spaceflight affects it**
- Gravity changes cause space motion sickness (most astronauts get it, and susceptibility on Earth doesn't predict it) and spatial disorientation.
- These can impair piloting, landing and spacewalks.

**Indicators**

| Indicator | Unit / input | How to measure | When | Green | Amber | Red |
|---|---|---|---|---|---|---|
| Motion sickness | 0–3 scale (none, mild, moderate, vomiting) | Self-report | Daily, plus after gravity transitions | 0 | 1 | 2–3 |
| Dizziness / disorientation | 0–3 scale | Self-report | Daily, plus after gravity transitions | 0 | 1 | 2–3 |
| Balance self-test | seconds standing on one leg, eyes closed (surface ops only) | Timed test | After landing / weekly on a surface | ≥ baseline −20% | −20 to −40% | worse than −40% |

*Thresholds are illustrative.*

**Actions**
- **Green:** routine.
- **Amber:** limit head movements, use anti-motion-sickness medication per protocol and avoid critical tasks until it improves.
- **Red:** no piloting, spacewalks or driving; follow the protocol and escalate.

**Sources:** risk-of-altered-sensorimotor-and-vestibular-function, simulating-manual-piloting-for-moon-landings, artemis-ii-standard-measures

---

## 8. Radiation exposure

**Body map region:** whole-body badge

**What it does:** this is not an organ. It tracks cumulative dose, which affects all tissues.

**How spaceflight affects it**
- Radiation raises cancer risk and can damage the heart, blood vessels, eyes (cataracts) and bone marrow, and affect cognition.
- Neutrons are about 30% of the ISS radiation dose. ISS crews receive about 150 µSv/day of neutron radiation, hundreds of times the dose on Earth, and less in sleeping quarters.
- Spacewalk skin doses can be 6–25× those of nuclear workers.
- Moon and Mars missions leave Earth's protective magnetosphere.

**Indicators**

| Indicator | Unit / input | How to measure | When | Green | Amber | Red |
|---|---|---|---|---|---|---|
| Cumulative mission dose | mSv, number | Personal dosimeter readout | Weekly, plus after each spacewalk | <50% of mission budget | 50–80% | >80% |
| Daily dose rate | µSv/day, number | Dosimeter / area monitor | Weekly (auto from readouts) | At or below mission baseline | 1.5× baseline | ≥3× baseline (e.g. solar particle event) |
| Solar particle event alert | yes/no | From mission control or onboard monitor | As issued | None | Watch | Active event |

*Mission budgets and multipliers are illustrative demo values.*

**Actions**
- **Green:** wear the dosimeter and keep to the planned schedule.
- **Amber:** spend more time in the most shielded areas and review planned spacewalks.
- **Red:** move to the storm shelter or shielded area, defer spacewalks and escalate.

**Sources:** risk-of-radiation-induced-cancers, monitoring-radiation-for-astronaut-health, radi-n2-tracking-space-radiation-and-its-risks, little-transistor-records-radiation-levels, mosfet-radiation-monitoring-system-and-matroshka-r

---

## Escalation by mission

| Status | ISS (near real time) | Artemis lunar (~1.3 s delay) | Mars transit (up to ~20+ min delay) |
|---|---|---|---|
| Green | No action | No action | No action |
| Amber | Tell the CMO; it's included in the daily report to the ground | Tell the CMO; it's included in the daily report | The CMO decides; it's included in the next scheduled downlink |
| Red | Call flight surgeons now | Call flight surgeons; start the onboard protocol while connecting | Start the onboard protocol first; the CMO leads care; send a report and act on the reply when it arrives |

Sources: risk-of-behavioral-changes-and-psychiatric-disorders, risk-of-inadequate-teamwork, risk-of-inadequate-systems-operations-support, tempus-pro, why-do-we-conduct-science-experiments-in-space

## User profile & context

Information collected besides the 28 indicators. It gives the indicators something to compare against and sets the mission context.

### 1. Crew profile (once, before the mission)

| Field | Why it's needed |
|---|---|
| Display name / call sign | Identifies the crew member in the crew switcher; no full legal name needed |
| Age | Radiation cancer risk is personalized partly by age (risk-of-radiation-induced-cancers); some reference ranges differ by age |
| Sex | Radiation risk and some reference ranges differ by sex |
| Height | Baseline for spine lengthening (up to 3%, risk-of-spaceflight-induced-bone-changes) |
| Preflight body mass | Body mass is scored as % change from preflight |
| Regular supplements / medications | Pick from a list (e.g. daily B vitamin, bone medication). Only listed items get routine questions |

### 2. Preflight baselines (once; indicators are compared to these)

| Baseline | Used by |
|---|---|
| Resting blood pressure and heart rate | Trend and drift rules for indicators 1–2 |
| Strength self-test result | Fitness self-test, "% of preflight baseline" |
| Near-vision chart score | Near-vision self-check, "lines worse than baseline" |
| Balance self-test time | Balance self-test, "% worse than baseline" |
| Typical sleep hours | Sleep trend |

If a baseline is missing, the app uses the average of the first 7 days of check-ins. Seeded demo crew come with baselines filled in.

### 3. Mission context (set per mission)

| Field | Why it's needed |
|---|---|
| Mission profile (ISS / Artemis lunar / Mars transit) | Escalation wording, radiation rate, resupply |
| Mission start date | Gives the mission day, which drives the bone-loss estimate, weekly prompts and charts |

The radiation dose budget is **not** entered by the user. It's a built-in demo value for each mission profile in `missions.ts`, used to score cumulative dose as % of budget. The crew switcher lists the saved profiles for the current mission, so no separate crew list is needed.

### 4. Event and countermeasure logs (quick taps, as they happen)

| Log | Why it's needed |
|---|---|
| Events: spacewalk, landing/docking, gravity transition | Opens the motion sickness, dizziness, balance and post-spacewalk dose follow-ups |
| Countermeasures and medications | Explains readings (e.g. motion sickness after medicine, BP after caffeine) and records the countermeasures the actions recommend. Asked through the questions below |
| Free-text note (on any check-in) | Context for the CMO or flight surgeons |

### Countermeasure and medication questions

One tap each, asked during the mission only when relevant, never as a daily list. On a normal day the user sees at most the supplements question.

**Triggered by a reading**

| Question | Answers | When asked | Typical frequency | Basis |
|---|---|---|---|---|
| "Did you wear thigh cuffs today?" | No · Yes, under 3 h · Yes, 3 h or more | After a headache or blurred-vision follow-up | Occasionally (symptom days) | thigh-cuff |
| "Did you take motion sickness medicine?" | No · Yes → Before symptoms · After symptoms | After motion sickness or dizziness is answered | Rare (early mission, after landings) | risk-of-altered-sensorimotor-and-vestibular-function |
| "Did you have caffeine in the last 6 hours?" | No · 1 drink · 2+ drinks | After an amber/red BP or heart rate reading, or poor sleep | Occasionally (a few times a month) | risk-from-inadequate-sleep-and-irregular-schedules |
| "Did you exercise in the hour before this reading?" | No · Yes | After an amber/red BP or heart rate reading | Rare | General measurement practice |
| "Did you take anything for pain or fever?" | No · Yes → pain reliever · fever reducer · other | After a headache, back pain or temperature ≥ 37.3 °C | Occasionally | General practice (medicine can mask a fever) |

**Routine**

| Question | Answers | When asked | Typical frequency | Basis |
|---|---|---|---|---|
| "Did you take your daily supplements?" | Yes · Missed today | Daily core, only if the profile lists supplements | Daily | b-complex |
| "Did you take your bone medication this week?" | Yes · Missed | Weekly, only if the profile lists it | Weekly | risk-of-spaceflight-induced-bone-changes |
| "Did you get your scheduled bright-light exposure?" | Yes · Partly · No | After a poor night's sleep | Occasionally | risk-from-inadequate-sleep-and-irregular-schedules |

**Before landing (event-driven)**

| Question | Answers | When asked | Typical frequency | Basis |
|---|---|---|---|---|
| "Have you completed fluid loading?" | Yes · Not yet | Before a landing event | Once per landing | risk-of-cardiovascular-adaptations |
| "Are you wearing compression garments?" | Yes · Not yet | Before a landing event | Once per landing | risk-of-cardiovascular-adaptations |

These answers don't change green/amber/red scoring. They appear next to the reading in charts and in the report to the CMO or flight surgeons.

### Not collected

Full legal name, birth date, medical history and contact details are not needed, and leaving them out reduces privacy risk. There are no accounts or logins: data stays in the browser.

## Check-in design: fast, low effort

All 28 indicators stay in the model. The check-in decides **when** each one is asked, so a normal day stays short and detail appears only when something looks off.

### Tiers

| Tier | When | Indicators | Target time |
|---|---|---|---|
| 1. Daily core | Every morning | Blood pressure, resting heart rate, body temperature, sleep hours, mood, exercise minutes, plus one "Any symptoms today?" (yes/no) | ~2 min |
| 2. Follow-ups | Only when triggered (see below) | Headache, blurred vision, palpitations, neck/arm swelling, back pain, immune symptom checklist, appetite, meals completed, motion sickness, dizziness, sleep quality, stress | +30–60 s |
| 3. Weekly | One day a week, spread across the week | Near-vision check, fitness self-test, body mass, blood glucose, dosimeter readout, crew relations | ~5 min |
| 4. Automatic / event | No typing, or only after an event | Estimated bone loss, daily dose rate (calculated); solar particle event alert (from mission control/monitor); balance self-test (after landing / on a surface) | 0 min |

### Triggers for follow-ups

| Trigger | Opens |
|---|---|
| "Any symptoms today?" = yes | A one-screen tap list: headache · blurred vision · palpitations · neck/arm swelling · back pain · cold sore/rash/sore throat/cough · poor appetite · motion sickness · dizziness. Each tapped item asks only its own scale |
| Mood ≤ 3 | Stress, sleep quality |
| Sleep < 7 h | Sleep quality |
| Any core reading amber or red | That system's remaining indicators |
| Gravity transition (landing, docking, surface EVA) in the last 24 h | Motion sickness, dizziness, balance self-test |
| Temperature ≥ 37.3 °C | Immune symptom checklist |

### Make answering effortless

- **Tap, don't type.** Scales are big buttons with words and faces, e.g. Mood: 😞 Bad · 🙁 Low · 😐 OK · 🙂 Good · 😄 Great. Typing is only for device numbers.
- **Pre-filled numbers.** Number fields start at yesterday's value with −/+ steppers. Unchanged readings are confirmed in one tap.
- **"Same as yesterday".** One button per tier when nothing changed.
- **One plain question per screen.** For example, "How bad is your headache?" rather than "Headache severity (0–3)". The scale's meaning is written on the buttons.
- **Help on demand.** A small "How do I measure this?" link opens the steps from this file. It's hidden by default.
- **No mental math.** The app works out % of baseline, bone-loss estimates, dose budgets and trends. The user only enters what they see or feel.
- **Instant feedback.** After submitting, the body map updates and any amber or red system shows its one next action.
- **Skip allowed.** Any item can be skipped. It shows as "not recorded", not as red, and comes back in the next prompt.

### Scale conventions

To reduce thinking, self-report items use just two scale shapes:
- **Severity (none → severe):** 0 None · 1 Mild · 2 Moderate · 3 Severe. Used for headache, blurred vision, back pain, motion sickness and dizziness. The green/amber/red cut-offs for each item are in its indicator table above.
- **Rating (bad → great):** 1–5 with words. Used for mood, stress (inverted: 1 Calm … 5 Overwhelmed), sleep quality, appetite and crew relations.
