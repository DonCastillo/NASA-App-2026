# BodyMap: Crew Health — Nice to Have

Ideas worth building if there is time after the must-haves in [tasks.md](tasks.md). Each entry says what it is, why it helps, how it fits the existing design, and roughly how long it takes. None of these are scheduled yet.

---

## 1. Eye tests in the app

**Status:** idea, not scheduled. Fallback until then: the physical near-vision card plus a number input (current plan).

### Why

The *Near-vision self-check* indicator ([body-systems.md](body-systems.md) §2, `nearVision` in `src/data/systems/eyes.ts`) currently assumes a printed near-vision card: the astronaut reads it and types the smallest line they can read. Building the test into the app:

- makes the measurement self-contained (no card needed)
- matches the challenge's ask to help astronauts take measurements themselves
- gives a strong, interactive demo moment
- fits the challenge's gamification suggestion

### Options considered

| | How it works | Pros | Cons |
|---|---|---|---|
| **A. Physical card** (current plan) | Read a printed card at a set distance and enter the smallest readable line | Simplest; realistic | Nothing to show in the demo; needs a card |
| **B. On-screen reading chart** | Rows of letters get smaller, like a classic eye chart. Hold the device at arm's length, cover one eye, and tap the smallest row you can read. Repeat with the other eye | Easy to build; self-contained | Text size differs between screens. That's acceptable, because results are compared with the user's own preflight result on the same device |
| **C. "Tumbling E" test** (recommended) | One letter E points up, down, left or right. Tap or swipe its direction. Each correct answer makes it smaller, until answers start to miss. The smallest size answered correctly is the score. One eye at a time | More objective (rows can't be guessed); feels like a game; about 1 minute per eye | About 1–2 h more work than a number input |

### Recommendation

**Build C (Tumbling E).** Keep A (card + number input) as the fallback, so the cut order in [roadmap.md](roadmap.md#risks-and-cuts) stays safe.

### Related extra: Amsler grid

A square grid with a dot in the middle. Look at the dot with one eye and tap any area where lines look wavy, blurry or missing. It's a standard self-check for distorted vision.

- **Feeds:** the *Blurred or distorted vision* indicator (`blurredVision`), with something more concrete than a 0–3 rating, e.g. number of areas tapped → severity
- **Effort:** quick, about 1 h; one tappable SVG grid

### How it plugs into the existing design

- **Indicator unchanged:** `nearVision` stays a number scored against the preflight baseline (`basis: 'changeFromBaseline'`, lines worse → amber/red). Scoring, trend charts and the system detail panel don't change.
- **Only the input screen changes:** in the check-in, the near-vision question opens the test instead of a number stepper. The test's result (smallest size answered correctly, mapped to a "line" number) is saved as the reading.
- **Baseline:** the first test in Setup, or the 7-day fallback, becomes the preflight baseline, on the same device.
- **How to measure:** the steps for `nearVision` change from "read the card" to the in-app test instructions (distance, cover one eye, swipe the direction).
- **Accessibility:** buttons for the four directions as well as swipes; works with keyboard arrow keys.

### Tasks (if scheduled, add to Phase 5 in tasks.md)

- [ ] `TumblingETest` component: random direction, size steps, stop after 2 misses at a size; one eye at a time
- [ ] Map the smallest correct size to a line number; save it as the `nearVision` reading
- [ ] Instructions screen: arm's length, good light, cover one eye
- [ ] Use the test in the check-in (weekly vision task) and in Setup for the baseline
- [ ] Unit tests for the size steps and the score mapping
- [ ] Optional: `AmslerGrid` component feeding `blurredVision`
- [ ] Update `howToMeasure` for `nearVision` (and `blurredVision` if the grid is built)

**Effort:** about 1–2 h for the Tumbling E, plus about 1 h for the Amsler grid.
