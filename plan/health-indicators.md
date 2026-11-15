# BodyMap: Crew Health — Health Indicators and Sources

This file lists all 28 indicators in [body-systems.md](body-systems.md) and where each one comes from. Article names refer to files in [articles/](articles/).

## Source types

| Type | Meaning | Count |
|---|---|---|
| **Direct** | The indicator or measurement is named in the challenge statement or an article | 18 |
| **Proxy** | An article names the health risk, and we chose a self-check an astronaut can do in flight to watch for it | 9 |
| **Added** | Not in the provided sources; added from general spaceflight knowledge | 1 |

**Thresholds are not covered here.** The green/amber/red cut-offs in [body-systems.md](body-systems.md) are general adult reference ranges or demo values, not taken from these sources.

## All indicators

| # | Indicator | Body system | Type | Source | Basis |
|---|---|---|---|---|---|
| 1 | Blood pressure | Heart & circulation | Direct | [challenge-statement](challenge-statement.md); risk-of-cardiovascular-adaptations, venous-haemostasis | Named as a useful indicator; low blood pressure at landing and in-flight blood pressure checks |
| 2 | Resting heart rate | Heart & circulation | Direct | [challenge-statement](challenge-statement.md) | Named as a useful indicator |
| 3 | Palpitations / irregular heartbeat | Heart & circulation | Proxy | risk-of-cardiovascular-adaptations, cipher | Arrhythmias are a named spaceflight risk |
| 4 | Neck or arm swelling / pain | Heart & circulation | Proxy | venous-haemostasis, risk-of-cardiovascular-adaptations | Blood clots from altered venous (jugular) flow; swelling is a common warning sign |
| 5 | Near-vision self-check | Eyes & brain (SANS) | Proxy | risk-of-spaceflight-associated-neuro-ocular-syndrome-sans, cipher | SANS eye changes are found by eye exams; a chart test is the in-flight stand-in |
| 6 | Blurred or distorted vision | Eyes & brain (SANS) | Direct | thigh-cuff, cipher | Crew record vision changes |
| 7 | Headache | Eyes & brain (SANS) | Proxy | risk-of-hypoxia, risk-of-spaceflight-associated-neuro-ocular-syndrome-sans | Headache is a named hypoxia symptom; fluid shift toward the head drives SANS |
| 8 | Exercise completed (minutes) | Bones & muscles | Direct | risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness | ISS crews exercise 1.5 h a day, 6–7 days a week |
| 9 | Fitness self-test (strength) | Bones & muscles | Direct | risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness, zero-t2 | Periodic fitness self-evaluations; 10–12% average strength and fitness loss |
| 10 | Estimated bone loss | Bones & muscles | Proxy | risk-of-spaceflight-induced-bone-changes, astronauts-spines-under-scrutiny | Calculated from the 1–1.5% per month bone density loss rate |
| 11 | Back pain | Bones & muscles | Proxy | risk-of-spaceflight-induced-bone-changes, astronauts-spines-under-scrutiny | Spine lengthens up to 3% and postural muscles atrophy; pain itself is not named |
| 12 | Body temperature | Immune system | Direct | [challenge-statement](challenge-statement.md) | Named as a useful indicator |
| 13 | Immune symptoms (cold sore, rash, allergy, infection) | Immune system | Direct | risk-of-altered-immune-system-responses, immune-biomarkers, scientists-probe-how-long-term-spaceflight-alters-immunity | Crew have reported cold sores, rashes, atypical allergies and infections; dormant viruses reactivate |
| 14 | Blood glucose | Metabolism & nutrition | Direct | [challenge-statement](challenge-statement.md) | Named as a useful indicator (blood sugar in mg/dL); not in the articles |
| 15 | Body mass | Metabolism & nutrition | Direct | how-does-spaceflight-change-food-appeal | Menu fatigue can lead to body mass loss |
| 16 | Appetite / food enjoyment | Metabolism & nutrition | Direct | how-does-spaceflight-change-food-appeal | Astronauts rate food acceptability in weekly surveys; menu fatigue reduces appetite |
| 17 | Meals completed | Metabolism & nutrition | Proxy | how-does-spaceflight-change-food-appeal, risk-of-inadequate-food-and-nutrition | Reduced intake from menu fatigue can cause nutritional deficiencies |
| 18 | Sleep duration | Mind & sleep | Direct | [challenge-statement](challenge-statement.md); archer, standard-measures | Named as a useful indicator; sleep tracked by actigraphy / wrist sensor |
| 19 | Sleep quality | Mind & sleep | Proxy | risk-from-inadequate-sleep-and-irregular-schedules, standard-measures | Sleep disruption is a named risk; crew give sleep reports |
| 20 | Mood | Mind & sleep | Direct | [challenge-statement](challenge-statement.md); can-space-gardening-help-astronauts-cope-with-isolation | Named as a useful indicator; mood surveyed in the gardening study |
| 21 | Stress | Mind & sleep | Proxy | risk-of-behavioral-changes-and-psychiatric-disorders, scientists-probe-how-long-term-spaceflight-alters-immunity | Stress is a named factor in behavioral health and immune changes (stress hormones measured in the lab) |
| 22 | Crew relations | Mind & sleep | Direct | can-space-gardening-help-astronauts-cope-with-isolation, risk-of-inadequate-teamwork | Surveys ask about crew relationships; teamwork is a named risk |
| 23 | Motion sickness | Balance & orientation | Direct | risk-of-altered-sensorimotor-and-vestibular-function, artemis-ii-standard-measures | Most astronauts get space motion sickness; it is measured after flight |
| 24 | Dizziness / disorientation | Balance & orientation | Direct | risk-of-altered-sensorimotor-and-vestibular-function, simulating-manual-piloting-for-moon-landings | Spatial disorientation and dizziness after gravity transitions |
| 25 | Balance self-test | Balance & orientation | Direct | simulating-manual-piloting-for-moon-landings, artemis-ii-standard-measures, zero-t2 | Balance tests before, during and after missions |
| 26 | Cumulative mission dose | Radiation | Direct | little-transistor-records-radiation-levels, mosfet-radiation-monitoring-system-and-matroshka-r, radi-n2-tracking-space-radiation-and-its-risks | Personal dosimeters measure astronaut dose |
| 27 | Daily dose rate | Radiation | Direct | radi-n2-tracking-space-radiation-and-its-risks, monitoring-radiation-for-astronaut-health | ISS crews receive ~150 µSv/day of neutron radiation; CANS measures continuously |
| 28 | Solar particle event alert | Radiation | Added | — | Real spaceflight radiation hazard, but not mentioned in the provided articles |

## Summary by body system

| Body system | Direct | Proxy | Added | Total |
|---|---|---|---|---|
| Heart & circulation | 2 | 2 | 0 | 4 |
| Eyes & brain (SANS) | 1 | 2 | 0 | 3 |
| Bones & muscles | 2 | 2 | 0 | 4 |
| Immune system | 2 | 0 | 0 | 2 |
| Metabolism & nutrition | 3 | 1 | 0 | 4 |
| Mind & sleep | 3 | 2 | 0 | 5 |
| Balance & orientation | 3 | 0 | 0 | 3 |
| Radiation | 2 | 0 | 1 | 3 |
| **Total** | **18** | **9** | **1** | **28** |
