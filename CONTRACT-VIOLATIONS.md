# Page Contract Violations

102 violations across 32 pages. Generated 2026-05-15.

**Checks:**
- `menuBar` — `.nav-bar` must have `data-home` (required), `data-title` or `data-no-title="<reason>"`, `data-instruction` or `data-no-instruction="<reason>"` (when title set), `data-links` or `data-no-links="<reason>"`; page must also have a `.game-area` wrapper
- `speakableUI` — every activity must link `../../shared/speakable.css` and import `../../../ui/speech/speech-ui.js`

---

## menuBar — Missing `.nav-bar` entirely

| File | Note | Resolution |
|------|------|------------|
| ~~`app/activities/simulator/index.html`~~ | ✅ Fixed | nav-bar added with opt-outs; `.game-area` wrapper added |
| `app/activities/story-time/index.html` | No nav-bar, no speakable | Add `.nav-bar` with all required attrs, or exclude page from contract |
| `app/worksheets/character-worksheet/index.html` | Worksheet — no nav-bar, no speakable | Add `.nav-bar` with all required attrs, or exclude page from contract |
| `app/worksheets/colouring-sheets/index.html` | Worksheet — no nav-bar, no speakable | Add `.nav-bar` with all required attrs, or exclude page from contract |

---

## menuBar — Has `.nav-bar` but missing `.game-area` wrapper

Content must be wrapped in `<div class="game-area">` so the nav-bar sits correctly on the left.

| File | Resolution |
|------|------------|
| `app/activities/piano/songs.html` | Wrap body content in `<div class="game-area">` |

---

## menuBar — Missing `data-title` (and therefore `data-instruction` + `data-links`)

These pages have `<div class="nav-bar" data-home="...">` with no title, instruction, or links attrs.

| File | Current nav-bar state | Resolution |
|------|-----------------------|------------|
| `app/activities/colouring/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/colouring-palette/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/connect-the-dots/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/count-shapes/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/drawing-dots/index.html` | `data-home="../../games/"` + `data-prev`/`data-next` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/match-colour/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/match-colour-shape/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/match-shape/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/move-blocks/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/primary-colours/index.html` | `data-home="../../games/"` + inline `<a>` child | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out); migrate inline `<a>` to `data-links` |
| `app/activities/puzzle/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/puzzle/play.html` | `data-home="./"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/secondary-colours/index.html` | `data-home="../../games/"` + inline `<a>` child | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out); migrate inline `<a>` to `data-links` |
| `app/activities/shopping-play/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |
| `app/activities/shopping-scan/index.html` | `data-home="../../games/"` only | Add `data-title`, `data-instruction` (or opt-outs), `data-links` (or opt-out) |

---

## menuBar — Has `data-title`, missing `data-instruction`

These pages have title + links set, but no `data-instruction` or `data-no-instruction`.

| File | Current nav-bar title | Resolution |
|------|-----------------------|------------|
| `app/activities/character-lesson/index.html` | `data-title="Trace Letters"` (also missing `data-links`) | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/clock/game-mc.html` | `data-title="What Time Is It?"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/clock/index.html` | `data-title="Clocks"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/colour-wheel/index.html` | `data-title="Colour Wheel"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/logic-gates/puzzle.html` | `data-title="Logic Puzzle"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/logic-gates/sandbox.html` | `data-title="Logic Gates"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/piano/game.html` | `data-title="Piano Game"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/piano/lesson.html` | `data-title="Piano"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/piano/songs.html` | `data-title="🎹 Songs"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/say-words/index.html` | `data-title="Say Words"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/word-lesson/index.html` | `data-title="Trace Words"` (also missing `data-links`) | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |
| `app/activities/word-match/index.html` | `data-title="Word Match"` | Add `data-instruction="..."` or `data-no-instruction="<reason>"` |

---

## menuBar — Has `data-title`, missing `data-links`

| File | Note | Resolution |
|------|------|------------|
| `app/activities/character-lesson/index.html` | Also missing `data-instruction` (see above) | Add `data-links='[...]'` or `data-no-links="<reason>"` |
| `app/activities/number-interaction/index.html` | Has title + instruction, only missing links | Add `data-links='[...]'` or `data-no-links="<reason>"` |
| `app/activities/word-lesson/index.html` | Also missing `data-instruction` (see above) | Add `data-links='[...]'` or `data-no-links="<reason>"` |

---

## speakableUI — `speakable.css` not linked

Add `<link rel="stylesheet" href="../../shared/speakable.css">` in `<head>`, or opt out.

| File |
|------|
| `app/activities/character-lesson/index.html` |
| `app/activities/colouring/index.html` |
| `app/activities/colouring-palette/index.html` |
| `app/activities/connect-the-dots/index.html` |
| `app/activities/count-shapes/index.html` |
| `app/activities/drawing-dots/index.html` |
| `app/activities/logic-gates/puzzle.html` |
| `app/activities/logic-gates/sandbox.html` |
| `app/activities/match-colour/index.html` |
| `app/activities/match-colour-shape/index.html` |
| `app/activities/match-shape/index.html` |
| `app/activities/move-blocks/index.html` |
| `app/activities/piano/game.html` |
| `app/activities/piano/lesson.html` |
| `app/activities/piano/songs.html` |
| `app/activities/primary-colours/index.html` |
| `app/activities/puzzle/index.html` |
| `app/activities/puzzle/play.html` |
| `app/activities/secondary-colours/index.html` |
| `app/activities/shopping-play/index.html` |
| `app/activities/shopping-scan/index.html` |
| `app/activities/story-time/index.html` |
| `app/activities/word-lesson/index.html` |
| `app/worksheets/character-worksheet/index.html` |
| `app/worksheets/colouring-sheets/index.html` |

---

## speakableUI — `speech-ui.js` not imported

Add `import '../../../ui/speech/speech-ui.js';` inside a `<script type="module">`, or opt out.

| File | Note |
|------|------|
| `app/activities/character-lesson/index.html` | |
| `app/activities/colour-wheel/index.html` | Has `speakable.css` — partial import only |
| `app/activities/colouring/index.html` | |
| `app/activities/colouring-palette/index.html` | |
| `app/activities/connect-the-dots/index.html` | |
| `app/activities/count-shapes/index.html` | |
| `app/activities/drawing-dots/index.html` | |
| `app/activities/match-colour/index.html` | |
| `app/activities/match-colour-shape/index.html` | |
| `app/activities/match-shape/index.html` | |
| `app/activities/move-blocks/index.html` | |
| `app/activities/piano/songs.html` | Has `speakable.css` — partial import only |
| `app/activities/primary-colours/index.html` | |
| `app/activities/puzzle/index.html` | |
| `app/activities/puzzle/play.html` | |
| `app/activities/say-words/index.html` | Has `speakable.css` + uses `makeSpeakable` — just missing `speech-ui.js` import |
| `app/activities/secondary-colours/index.html` | |
| `app/activities/shopping-play/index.html` | |
| `app/activities/shopping-scan/index.html` | |
| `app/activities/simulator/index.html` | Has `speakable.css` — partial import only |
| `app/activities/story-time/index.html` | |
| `app/activities/word-lesson/index.html` | |
| `app/activities/word-match/index.html` | Has `speakable.css` — partial import only |
| `app/worksheets/character-worksheet/index.html` | |
| `app/worksheets/colouring-sheets/index.html` | |
