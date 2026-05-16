# Page Contract Violations

19 violations across 19 pages. Generated 2026-05-16.

**Checks:**
- `speakableUI` — every button must be wired to the speakable system (have `data-speakable` or equivalent). Pages that import `speech-ui.js` are checked; unwired buttons fail.

---

## speakableUI — Unwired buttons

Buttons exist on page but lack speakable wiring. Add `data-speakable="<label>"` to each button (or `makeSpeakable()` / equivalent JS wiring).

| File | Unwired buttons |
|------|----------------|
| `app/activities/character-lesson/index.html` | All, a–z, A–Z, 0–9, ▶ Trace, 📚 Watch, 🔈 Speak, Try It →, ■ Reset, ← Prev, Next → |
| `app/activities/clock/game-mc.html` | 🛏️Bedtime, 🌙Nighttime, 🌃Midnight, 💼Work |
| `app/activities/colouring-palette/index.html` | All, 🐾 Animals, 🍎 Fruit, 🏥 Medical, Prototype, 🚗 Vehicles, ← Prev, Next → |
| `app/activities/colouring/index.html` | All, 🐾 Animals, 🍎 Fruit, 🏥 Medical, Prototype, 🚗 Vehicles, ← Prev, Next → |
| `app/activities/connect-the-dots/index.html` | All, 🐾 Animals, 🍎 Fruit, Prototype, 🚗 Vehicles, All Levels, Level 1, ← Prev, Next → |
| `app/activities/count-shapes/index.html` | 1, 2, 3, 4, 5 |
| `app/activities/drawing-dots/index.html` | All, 🐾 Animals, All Levels, Level 1, Level 2 |
| `app/activities/logic-gates/puzzle.html` | All, Linear, Converging, Reset, ← Prev, Next → |
| `app/activities/match-colour-shape/index.html` | 6× (no text) — colour swatch buttons |
| `app/activities/match-colour/index.html` | 6× (no text) — colour swatch buttons |
| `app/activities/match-shape/index.html` | 6× (no text) — colour swatch buttons |
| `app/activities/move-blocks/index.html` | ↑, ←, →, ↓ |
| `app/activities/piano/game.html` | ▶ Play, ▮▮ Pause, ▮ Stop, Play Again |
| `app/activities/puzzle/play.html` | Hide guide |
| `app/activities/say-words/index.html` | All, 🐾 Animals, 😊 Emotions, 🍎 Fruit, 🏥 Medical, 🚗 Vehicles, All Levels, Level 1, ← Prev, Next → |
| `app/activities/shopping-play/index.html` | All filter + item buttons (~38 total — dynamically rendered) |
| `app/activities/shopping-scan/index.html` | All, item buttons, Find it! 🔍, Scan it! 📷, Scan (~13 total) |
| `app/activities/word-lesson/index.html` | All, category filters, Custom, ↻ Go, 📚 Watch, 🔈 Say It, Try It →, ■ Reset, ← Prev, Next → |
| `app/activities/word-match/index.html` | All, category filters, All Levels, Level 1, 4× (no text) answer buttons |

---

## Notes

- `match-colour`, `match-colour-shape`, `match-shape` — "(no text)" buttons are colour swatches. Need `data-speakable` with the colour name.
- `shopping-play`, `shopping-scan` — many buttons rendered dynamically from data; wiring likely needs to happen in JS after render, not in HTML.
- Pages passing all checks (10): `clock/`, `colour-wheel/`, `logic-gates/sandbox.html`, `number-interaction/`, `piano/lesson.html`, `primary-colours/`, `puzzle/`, `secondary-colours/`, `worksheets/character-worksheet/`, `worksheets/colouring-sheets/`
