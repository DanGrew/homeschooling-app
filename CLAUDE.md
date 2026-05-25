# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## STOP — Read Before Implementing

Before any implementation:
1. Pull `main` and create a new branch off it
2. Read `TESTING.md` — this repo has tight CI quality checks; skipping this causes refactor cycles

## Project

Public-facing homeschooling app. Activities built for a child aged 3–4. This repo contains only the app shell and HTML/SVG activities — curriculum thinking and EYFS reference material lives in the private `homeschooling` repo.

**Architecture:** app is a static site served via GitHub Pages at `https://dangrew.github.io/homeschooling-app/`. No build step — files are served directly, relative links work as-is.

## Repository Structure

- `index.html` — root redirect to `app/`
- `app/index.html` — home page (Lessons / Worksheets / Games tiles)
- `app/lessons/` — lessons section
- `app/worksheets/` — worksheets section
- `app/games/` — games activities (count shapes, match colour, match shape, connect the dots, etc.)

## Guidelines

Full session guidelines (output standards, token efficiency, ways of working) are maintained in the private `homeschooling` repo. If working in this repo, ask the user to paste the relevant sections from there before starting.

## Output Standards

- SVG: no comments, no decorative whitespace, no `id`/`class` unless needed for CSS
- HTML: inline styles only, no unused rules, no comments
- Markdown: no preamble, no trailing summaries — content only

Return only the generated output unless explanation is explicitly requested.

## Testing

See `TESTING.md` for full ways of working. Summary:
- **Vitest** (`npm run test:unit`) — pure functions, no DOM, `tests/unit/`
- **Playwright** (`npm test`) — user journeys, browser interactions, `tests/`
- Both required to pass on every PR.

**Never run the full Playwright suite (`npm test`) without explicit user permission.** Full suite takes ~4 minutes. Run only the specific test file for the feature under development: `npx playwright test tests/<file>.test.js`. CI runs the full suite on every PR.

## Git and GitHub

**Branching:** Feature branches off `main`. Naming: `<topic>-<descriptor>`.
**PRs:** Always draft (`--draft`), one per logical unit. Merge target is always `main`.

## Tooling

**gh CLI:** not on PATH in bash — always use full path: `"/c/Program Files/GitHub CLI/gh.exe"`
**Parallel agents:** `gh pr create` is blocked in the agent sandbox — PR creation must always be done from the main session after agents complete.

## Guidance + Page Control Pattern

Activities that use the guidance system (`components/guidance/guidance-service.js`) communicate with the page via two custom events on `window`:

**`guidance:event`** — page → guidance. Fired by the page when the child does something (taps, selects, etc.). Guidance checks against the current step's `expect` and advances if matched.
```js
window.dispatchEvent(new CustomEvent('guidance:event', { detail: { type: 'PRESET_WAKE_UP_SELECTED' } }));
```

**`page:control`** — guidance → page. Fired by guidance to instruct the page to change state. Two sources:
- `lesson.pageControls[]` — fires once on lesson start
- `step.pageControls[]` — fires on each step load
- `PAGE_CONTROL_RESET` — always fires on lesson stop

The page registers a `PAGE_CTRL` map and listens:
```js
var PAGE_CTRL = {
  'HIDE_SOMETHING': function() { ... },
  'PAGE_CONTROL_RESET': function() { ... }
};
window.addEventListener('page:control', function(e) {
  if (e.detail.type in PAGE_CTRL) PAGE_CTRL[e.detail.type]();
});
```

**Rule:** never modify `guidance-service.js` to add new behaviour. All page-specific logic goes in the page's `PAGE_CTRL` map. New controls are just new string keys.

## Token Efficiency

**Caveman** is installed globally. Use Lite mode by default for collaborative sessions. Use Full/Ultra for pure generation tasks (SVG, HTML, Markdown).

**Session discipline:**
- One session = one issue or activity
- Scope prompts to one file or one concern
- Use `/compact` before switching concerns within a long session

## Page Index

| Page | Path | Shared deps |
|------|------|-------------|
| Home hub | `app/index.html` | ui/shared, ui/story-time, components/*, core |
| Games hub | `app/games/index.html` | ui/shared, components/speech |
| Lessons hub | `app/lessons/index.html` | ui/shared |
| Stories hub | `app/stories/index.html` | ui/shared, components/speech |
| Worksheets hub | `app/worksheets/index.html` | ui/shared |
| Parental | `app/parental/index.html` | — |
| Curriculum matrix | `app/curriculum/index.html` | core/curriculum |
| Routine scheduler | `app/routine/index.html` | ui/routine, core/routine |
| Attributions | `app/attributions.html` | — |
| Physical hub | `app/physical/index.html` | core/physical |
| Letter tracing | `app/activities/character-lesson/index.html` | core/trace, ui/trace, ui/character-lesson, components/guidance, components/adult-prompts |
| Clock lesson | `app/activities/clock/index.html` | core/clock, ui/clock |
| Clock game | `app/activities/clock/game-mc.html` | core/clock, ui/clock |
| Colour wheel | `app/activities/colour-wheel/index.html` | core/colour-wheel, ui/colour-wheel |
| Colouring playground | `app/activities/colouring-playground/index.html` | core/colouring-playground, ui/colouring-playground |
| Connect the dots | `app/activities/connect-the-dots/index.html` | core/connect-the-dots, ui/shared |
| Count shapes | `app/activities/count-shapes/index.html` | core/count-shapes, ui/shared |
| Match colour | `app/activities/match-colour/index.html` | core/shapes, ui/shared |
| Match shape | `app/activities/match-shape/index.html` | core/shapes, ui/shared |
| Match colour+shape | `app/activities/match-colour-shape/index.html` | core/match-colour-shape, ui/match-colour-shape |
| Move blocks | `app/activities/move-blocks/index.html` | core/move-blocks, ui/move-blocks |
| Number interaction | `app/activities/number-interaction/index.html` | core/number-interaction, ui/number-interaction |
| Piano game | `app/activities/piano/game.html` | core/piano, ui/piano |
| Piano lesson | `app/activities/piano/lesson.html` | core/piano, ui/piano |
| Piano songs | `app/activities/piano/songs.html` | core/piano, ui/piano, content/audio/songs |
| Puzzle | `app/activities/puzzle/index.html` | core/puzzle, ui/puzzle |
| Pairs memory | `app/activities/pairs/index.html` | core/pairs, ui/pairs, core/card-game, ui/card-game |
| Domino match | `app/activities/domino/index.html` | core/pairs (filterByTag), ui/domino, ui/card-game |
| Shopping game | `app/activities/shopping-game/index.html` | core/shopping-game, ui/shopping-game, core/card-game, ui/card-game |
| Word lesson | `app/activities/word-lesson/index.html` | ui/word-lesson, components/guidance |
| Word builder | `app/activities/word-builder/index.html` | core/word-builder, ui/word-builder, components/speech, components/success-banner |
| Word match | `app/activities/word-match/index.html` | core/word-match, ui/word-match |
| Primary colours | `app/activities/primary-colours/index.html` | core/shapes, ui/shared |
| Secondary colours | `app/activities/secondary-colours/index.html` | core/shapes, ui/shared |
| Shopping scan | `app/activities/shopping-scan/index.html` | core/shopping-scan, ui/shopping-scan |
| Simulator | `app/activities/simulator/index.html` | core/simulator, ui/simulator |
| Story time | `app/activities/story-time/index.html` | core/story-time, ui/story-time, content/story-time |
| Say words | `app/activities/say-words/index.html` | ui/shared, components/speech |
| Drawing dots | `app/activities/drawing-dots/index.html` | ui/shared |
| Logic gates puzzle | `app/activities/logic-gates/puzzle.html` | core/logic-gates, ui/logic-gates |
| Logic gates sandbox | `app/activities/logic-gates/sandbox.html` | core/logic-gates, ui/logic-gates |
| Character worksheet | `app/worksheets/character-worksheet/index.html` | core/character-worksheet, ui/character-worksheet |
| Colouring sheets | `app/worksheets/colouring-sheets/index.html` | core/dictionary, ui/colouring |
| Physical activities | `app/physical/activities/_shell.html` + variants | core/physical |
| Object Playground | `app/activities/object-playground/index.html` | core/object-playground, ui/object-playground |
| Crossing Playground (Frogger) | `app/activities/frogger/index.html` | core/frogger, ui/frogger, content/frogger/scenarios |

## Telemetry Pattern

All activities record a `learning_completed` event at session end using `recordLearningEvent` from `core/telemetry/learning-events.js`. Reference implementation: `ui/colouring-playground/colouring-playground-ui.js`.

```js
import { recordLearningEvent } from '../../core/telemetry/learning-events.js';

var eventFired = false;

function onActivityComplete() {
  if (eventFired) return;
  eventFired = true;
  recordLearningEvent({
    version: 1,
    type: 'learning_completed',
    timestamp: Date.now(),
    learning_id: 'activity-id',   // stable string identifying the activity/mode
    variant_id: variantId,        // e.g. content pack, puzzle id, catalog — omit if no variant
    activity_id: 'activity-id'    // same as learning_id unless activity has sub-modes
  });
}

function onReset() {
  eventFired = false;  // allow re-fire after reset/play-again
}
```

**Rules:**
- One event per completed session — guard with `eventFired` flag
- Reset flag on play-again / reset
- No intermediate events (taps, matches, etc.) — completion only
- Events stored in IndexedDB; visible on learnings page (`app/learnings/index.html`)

## Module Index

### core/
| Module | Purpose |
|--------|---------|
| `core/telemetry/learning-events.js` | Records learning events with UUID |
| `core/telemetry/learning-db.js` | Persists events to IndexedDB |
| `core/telemetry/learning-journal-core.js` | Aggregates events into journal data |
| `core/dictionary/dictionary-core.js` | Loads concept/rep data with caching |
| `core/dictionary/dictionary-helpers-core.js` | Filters and transforms dictionary entries |
| `core/shapes/shapes-core.js` | SVG shape/colour generators, random pickers |
| `core/curriculum/curriculum-core.js` | Lesson criteria mapping, EYFS alignment |
| `core/logic-gates/logic-engine.js` | Boolean gate evaluator (AND/OR/XOR/NOT) |
| `core/logic-gates/logic-gates-core.js` | Logic puzzle game logic |
| `core/logic-gates/puzzle-generator.js` | Generates logic gate puzzles |
| `core/trace/trace-core.js` | Letter tracing: path tracking, validation |
| `core/clock/clock-core.js` | Time parsing, display |
| `core/colour-wheel/colour-wheel-core.js` | RGB colour mixing logic |
| `core/colour-mixing/colour-mixing-core.js` | Colour blending utilities |
| `core/colouring-playground/colouring-playground-core.js` | Freeform painting core |
| `core/connect-the-dots/connect-the-dots-core.js` | Connect-the-dots game logic |
| `core/count-shapes/count-shapes-core.js` | Shape counting game |
| `core/character-worksheet/character-worksheet-core.js` | Worksheet generation/rendering |
| `core/filter-bar/filter-bar-core.js` | Filtering/sorting utilities |
| `core/match-colour-shape/match-colour-shape-core.js` | Colour+shape matching game logic |
| `core/move-blocks/move-blocks-core.js` | Block puzzle solver |
| `core/number-interaction/number-interaction-core.js` | Number recognition/counting |
| `core/card-game/card-game-engine.js` | Shared card-game engine: shuffle, create, flip, resolve, layout key |
| `core/pairs/pairs-core.js` | Pairs memory game logic |
| `core/pairs/pairs-content.js` | Pairs content loader + tag filtering |
| `core/shopping-game/shopping-game-core.js` | Shopping game: list assignment, flip logic, scoring |
| `core/pagination/paginator-core.js` | Page navigation logic |
| `core/piano/piano-core.js` | Note data, song parsing, key mapping |
| `core/physical/physical-activity-core.js` | Physical activity coordination |
| `core/puzzle/puzzle-core.js` | Jigsaw puzzle logic |
| `core/routine/routine-core.js` | Daily routine scheduling |
| `core/shopping/shopping-core.js` | Shopping basket/catalog logic |
| `core/shopping-scan/shopping-scan-core.js` | Barcode/price scanning logic |
| `core/simulator/simulator-core.js` | State machines, animations, conditions (evalCond, applyStateAction, resolveScene) |
| `core/story-time/story-time-core.js` | Story audio playback control |
| `core/word-lesson/word-lesson-core.js` | Word vocabulary lessons |
| `core/word-builder/word-builder-core.js` | Word builder: parseWord, buildTileSet, validateLetter, isWordComplete, pickWord |
| `core/word-match/word-match-core.js` | Word matching game |
| `core/object-playground/object-playground-core.js` | Object playground: state init, shape rendering, constants |
| `core/frogger/frogger-core.js` | Frogger simulation: grid, lanes, entities, spawning, player, collision |
| `core/frogger/frogger-loader.js` | Frogger scenario JSON parser + field validator |

### ui/
| Module | Purpose |
|--------|---------|
| `ui/shared/audio-ctx.js` | Web Audio API wrapper (createAudioCtx, decodeAudioBuffer, unlockAudioCtx) |
| `ui/shared/long-press.js` | Long-press gesture detector |
| `ui/character-lesson/character-lesson-ui.js` | Tracing UI renderer |
| `ui/character-worksheet/character-worksheet-ui.js` | Worksheet print UI |
| `ui/clock/clock-ui.js` | Clock display renderer |
| `ui/clock/digital-ui.js` | Digital clock display |
| `ui/clock/sky-ui.js` | Animated sky background |
| `ui/clock/choice-ui.js` | Clock time picker |
| `ui/colour-wheel/colour-wheel-ui.js` | Colour wheel renderer |
| `ui/colouring/colouring-common.js` | Shared colouring canvas utilities |
| `ui/colouring-playground/colouring-playground-ui.js` | Freeform painting UI |
| `ui/object-playground/object-playground-ui.js` | Object playground: SVG canvas render, init |
| `ui/frogger/frogger-renderer.js` | Frogger DOM renderer: grid, entities, player hop animation, collision highlight |
| `ui/logic-gates/puzzle-ui.js` | Logic puzzle board UI |
| `ui/logic-gates/sandbox-ui.js` | Logic gate builder UI |
| `ui/match-colour-shape/match-colour-shape-ui.js` | Match game UI |
| `ui/move-blocks/move-blocks-ui.js` | Block puzzle UI |
| `ui/number-interaction/number-interaction-ui.js` | Number UI |
| `ui/card-game/card-game-ui.js` | Shared card-game UI: setup sections, grid, cards, trays, handover |
| `ui/pairs/pairs-ui.js` | Pairs game UI |
| `ui/domino/domino-ui.js` | Domino setup screen UI |
| `ui/domino/domino-board-ui.js` | Domino board canvas: tile/endpoint rendering, pan |
| `ui/domino/domino-tray-ui.js` | Domino player tray: active player hand tiles, draw/place updates |
| `ui/shopping-game/shopping-game-ui.js` | Shopping game UI: shopping tray, list items, summary |
| `ui/piano/piano-ui.js` | Piano keyboard UI |
| `ui/piano/piano-game-ui.js` | Piano game mode UI |
| `ui/piano/piano-song-ui.js` | Piano song player UI |
| `ui/puzzle/puzzle-grid-ui.js` | Puzzle grid renderer |
| `ui/puzzle/puzzle-tray-ui.js` | Puzzle piece tray UI |
| `ui/routine/routine.js` | Routine scheduler UI |
| `ui/shopping/shopping-ui.js` | Shopping basket/catalog UI |
| `ui/shopping-scan/shopping-scan-ui.js` | Barcode scanner UI |
| `ui/simulator/simulator-engine.js` | Simulator animation/event engine |
| `ui/simulator/loader.js` | Simulator asset/content loader |
| `ui/story-time/player.js` | Audio story player UI |
| `ui/trace/trace-ui.js` | Trace canvas/feedback UI |
| `ui/word-lesson/word-lesson-ui.js` | Word lesson UI |
| `ui/word-builder/word-builder-ui.js` | Word builder: slot/tile render, placement feedback, TTS, banner |
| `ui/word-match/word-match-ui.js` | Word matching UI |

### components/
| Module | Purpose |
|--------|---------|
| `components/menu.js` | Nav bar builder |
| `components/adult-prompts/adult-prompts-ui.js` | Adult guidance prompt overlays |
| `components/filter-bar/filter-bar-ui.js` | Filter/sort UI widget |
| `components/guidance/guidance-service.js` | Guidance system coordinator |
| `components/guidance/guidance-overlay.js` | Guidance modal overlay |
| `components/guidance/word-bubble.js` | Speech bubble UI |
| `components/pagination/paginator-ui.js` | Pagination control UI |
| `components/speech/speakable.js` | Text-to-speech markup (makeSpeakable) |
| `components/speech/speech-ui.js` | Speech UI controller |
| `components/speech/voice-service.js` | Voice synthesis (Web Speech API) |
| `components/success-banner.js` | Success/reward animations |
| `components/learning-moments/learning-moment.js` | Learning moment notification (show/hide, ting audio, auto-dismiss) |

### content/
| Path | Purpose |
|------|---------|
| `content/adult-prompts/` | Parental guidance JSON per activity |
| `content/audio/songs/` | Song metadata (lyrics, melody, playback) |
| `content/clock/presets.json` | Clock preset times |
| `content/curriculum/criteria.json` | EYFS/NCETM learning criteria |
| `content/curriculum/coverage-policy.json` | Curriculum alignment rules |
| `content/dictionary/entries/` | 100+ vocabulary entries |
| `content/dictionary/manifests/` | Index manifests for colouring/connect-dots/images |
| `content/exercises/index.json` | Logic gate exercise catalog |
| `content/learnings/` | 60+ learning pathways |
| `content/lessons/` | Lesson metadata and navigation index |
| `content/logic-gates/` | Logic puzzle configurations |
| `content/physical/activities/` | Physical activity descriptions |
| `content/puzzle/manifest.json` | Puzzle piece definitions |
| `content/routine/` | Schedule JSON variants |
| `content/shopping-scan/catalogs/` | Shopping scan item catalogs (real barcodes) |
| `content/simulator/sims/` | Simulator state machine definitions |
| `content/story-time/` | Bible story audio scripts and metadata |
| `content/contracts/` | Test contract schemas |
| `content/schemas/` | JSON schema validators |
