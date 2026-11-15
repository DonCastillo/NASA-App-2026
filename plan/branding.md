# BodyMap: Crew Health — Branding & UI Theme

The look and feel of BodyMap. Every component uses the tokens below; no ad-hoc colors, fonts or sizes. Task 0.4 in [tasks.md](tasks.md) turns this file into the Tailwind theme.

**Direction:** *Mission control.* A dark navy "space" interface with crisp panels and a cyan accent, so it feels like a spacecraft display. The personality is **calm and precise**, reassuring like an instrument panel. **Dark theme only** (no light mode).

## 1. Brand basics

| | |
|---|---|
| Name | **BodyMap**, with "Crew Health" as a small subtitle |
| Tagline | "Tap a system, see your status." |
| Voice | Plain, calm, direct, second person ("Recheck your temperature in 4–6 h") |
| Never | Jargon without an explanation; alarmist wording, even for red ("Act now: run the infection protocol", not "DANGER") |

## 2. Color tokens

| Token | Hex | Use |
|---|---|---|
| `space-950` | `#0B1220` | App background |
| `space-900` | `#121B2E` | Panels, cards, header |
| `space-800` | `#1C2740` | Raised elements, hover, inputs, scale buttons |
| `space-700` | `#2A3756` | Borders, dividers, chart grid, callout lines |
| `text` | `#E2E8F0` | Main text |
| `text-muted` | `#94A3B8` | Secondary text, labels, body outline |
| `accent` | `#38BDF8` | Links, focus ring, active nav, primary buttons, selection |
| `ok` | `#22C55E` | Green status |
| `warn` | `#F59E0B` | Amber status |
| `alert` | `#EF4444` | Red status: fills, pins, chart bands |
| `alert-text` | `#F87171` | Red status: text and icons on dark |
| `none` | `#64748B` | "Not recorded": dots and fills only |

**Status color rules**
- Status colors are used **only for health status**. They're never decorative, and the accent is never green, amber or red.
- Every status keeps its icon and word, so color is never the only signal:

  | Status | Color | Icon | Word |
  |---|---|---|---|
  | Green | `ok` | ✓ | OK |
  | Amber | `warn` | ⚠ | Watch |
  | Red | `alert` / `alert-text` | ✖ | Act |
  | Not recorded | `none` (dot) + `text-muted` (word) | – | Not recorded |

**Contrast** (checked against WCAG AA, 4.5:1 for text)

| Color | On `space-900` | On `space-950` |
|---|---|---|
| `text` | 13.9 | 15.2 |
| `text-muted` | 6.7 | 7.3 |
| `accent` | 8.0 | 8.7 |
| `ok` | 7.5 | 8.2 |
| `warn` | 8.0 | 8.7 |
| `alert` | 4.6 | 5.0 |
| `alert-text` | 6.2 | 6.8 |
| `none` | 3.6 ✗ | 3.9 ✗ |

`none` fails as text, so the words "Not recorded" use `text-muted`. Dark text (`space-950`) on an `accent` button is 8.7.

## 3. Typography

| Role | Font | Sizes | Notes |
|---|---|---|---|
| UI text | **Inter** | 12 / 14 / 16 / 20 px | Body 400; headings 600 |
| Readings | **JetBrains Mono** | Same scale | Readings, units and mission day (`38.2 °C`, `Day 47/210`), with tabular numbers so digits line up |

- The fonts are installed with `@fontsource/inter` and `@fontsource/jetbrains-mono`, so the app works offline with no Google Fonts request.
- The page title is 20 px / 600. Section labels are 12 px, uppercase, letter-spaced and `text-muted` (e.g. "WHAT TO DO NOW").

## 4. Shape, spacing, depth

- **Spacing:** 8 px grid (4 px for tight gaps)
- **Corner radius:** 12 px for panels and cards · 8 px for buttons and inputs · fully round for pins, badges and chips
- **Depth:** 1 px `space-700` borders instead of heavy shadows. Only overlays get a soft shadow and a dimmed backdrop
- **Texture:** a faint starfield or grid on the home page background only

## 5. Body figure

- **Outline:** thin line, `text-muted`, 1.5 px stroke, no fill
- **Pins:** filled status circles with a soft outer glow (the status color at 30% opacity). The selected or hovered pin gets an `accent` ring
- **Red pins:** pulse slowly (about 2 s per cycle), the only looping animation in the app
- **Callout lines:** 1 px `space-700`
- **Labels:** 12 px Inter. The reading next to a label uses mono
- **Radiation badge:** rounded square with the ☢ icon, in its status color

## 6. Components

| Component | Style |
|---|---|
| Primary button | Filled `accent`, `space-950` text, 8 px radius |
| Secondary button | Transparent, 1 px `space-700` border, `text` |
| Danger button | Transparent, `alert` border and `alert-text` text. Used only for "Delete profile" |
| Status chip | Pill with a 15% tint of the status color, plus icon and word |
| Panel / card | `space-900` with a 1 px `space-700` border and 12 px radius |
| Scale buttons | 56 px tall tap targets in `space-800`. Selected: `accent` border and a light accent tint |
| Number stepper | Mono value in the center, 44 px −/+ buttons |
| Charts | Status bands at 12% opacity, a 2 px `accent` line, a dashed `text-muted` baseline, `space-700` grid, small `text-muted` triangles for event markers |
| Notification badge | Round, `accent` by default, `warn` if something is overdue, `alert` if a red recheck is due |
| Icons | lucide-react, 1.5 px stroke, 16 px and 20 px sizes |

## 7. Motion

| Interaction | Duration |
|---|---|
| Hover, focus, button press | 150 ms |
| Side panel slide, pin color change, overlay fade | 250 ms |
| Red pin pulse | ~2 s loop |

When the user has "reduce motion" turned on in their device settings (`prefers-reduced-motion`), the pulse stops and transitions become instant.

## 8. Logo and favicon

```
      .-~~~-.
    /   ( )   \      ← thin orbit ring
   |    /|\    ●     ← one cyan "pin" dot on the ring
    \   / \   /
      `-...-´
   BodyMap
   CREW HEALTH
```

- **Mark:** a simple body silhouette inside a thin orbit ring, with one `accent` dot on the ring as a pin
- **Wordmark:** "BodyMap" in Inter 600, with "CREW HEALTH" below in small caps, `text-muted`
- **Format:** inline SVG, also used as the favicon. No external image files

## 9. Accessibility rules

- **Focus ring:** 2 px `accent` with a 2 px offset, on every interactive element
- **Tap targets:** at least 44 px
- **Contrast:** text never sits on a status color without enough contrast (see the table in section 2)
- **Status:** always color + icon + word
