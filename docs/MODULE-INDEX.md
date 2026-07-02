# Module Index

Purpose of each `core/`, `ui/`, `components/`, and `content/` module. Referenced from `CLAUDE.md`.

## core/
| Module | Purpose |
|--------|---------|
| `core/guidance/lesson-pool.js` | Fisher-Yates shuffle + pool init for randomPools lesson steps |
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
| `core/paint-playground/paint-playground-core.js` | Paint playground: canvas state init, viewport, pan bounds |

## ui/
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
| `ui/paint-playground/paint-playground-ui.js` | Paint playground: two-layer canvas init, viewport positioning |
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

## components/
| Module | Purpose |
|--------|---------|
| `components/menu.js` | Nav bar builder |
| `components/adult-prompts/adult-prompts-ui.js` | Adult guidance prompt overlays |
| `components/filter-bar/filter-bar-ui.js` | Filter/sort UI widget |
| `components/pagination/paginator-ui.js` | Pagination control UI |
| `components/speech/speakable.js` | Text-to-speech markup (makeSpeakable) |
| `components/speech/speech-ui.js` | Speech UI controller |
| `components/speech/voice-service.js` | Voice synthesis (Web Speech API) |
| `components/success-banner.js` | Success/reward animations |
| `components/learning-moments/learning-moment.js` | Learning moment notification (show/hide, ting audio, auto-dismiss) |
| `components/learning-moments/learning-moment-service.js` | Learning moment dispatch service (showLearningMoment, cooldown, replace-on-overlap) |

## content/
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
| `content/logic-gates/` | Logic puzzle configurations |
| `content/physical/activities/` | Physical activity descriptions |
| `content/puzzle/manifest.json` | Puzzle piece definitions |
| `content/routine/` | Schedule JSON variants |
| `content/shopping-scan/catalogs/` | Shopping scan item catalogs (real barcodes) |
| `content/simulator/sims/` | Simulator state machine definitions |
| `content/story-time/` | Bible story audio scripts and metadata |
| `content/contracts/` | Test contract schemas |
| `content/schemas/` | JSON schema validators |
