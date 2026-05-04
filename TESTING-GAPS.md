# Testing Gaps — homeschooling-app

_Last updated: 2026-05-04_

---

## Known Issues — Needs Fixing

### `drawing-dots/engine-logic.js` is disconnected (duplication risk)

`engine-logic.js` was created as a test-only module. `engine.js` still contains identical copies of `edgeKey`, `buildAdj`, `computeR`. They can silently diverge.

**Root cause**: `engine.js` is a plain `<script>` tag — can't `import` from a module. Converting to a module breaks Playwright tests which access `tap`, `selectedDot`, `filtered` etc. as globals via `page.evaluate()`.

**Fix required**:
1. Convert `engine.js` to ES module (`export` functions + globals via `window.*`)
2. Update Playwright tests: `page.evaluate(() => tap(0))` → `page.evaluate(() => window.tap(0))`
3. Delete duplicate code from `engine.js`, import from `engine-logic.js`

---

## Remaining Gaps by Priority

### Critical — incomplete or disconnected

| File | Gap | Action |
|---|---|---|
| `drawing-dots/engine.js` | `engine-logic.js` disconnected — duplication risk | Convert to module (see above) |
| `simulator/engine/engine.js` | `_checkRules` untested — rule engine fires silently | Add unit test (easy, no DOM) |

### High — DOM-coupled, needs extraction first

| File | Extractable Logic | Blocker |
|---|---|---|
| `shared/trace-engine.js` | `_parseStrokes`, `_updateDistance`, completion % | Deeply DOM/SVG coupled |
| `shared/piano-shared.js` | Audio buffer load, AudioContext state | Web Audio API — needs mocking |
| `routine.js` | Render/scroll/focus functions | DOM-only, Playwright-only realistic option |

### Medium — missing functions in partially-tested files

| File | Untested Functions |
|---|---|
| `dictionary-helpers.js` | `loadConnectDots`, `loadDrawingDots`, `loadImages` |
| `shopping-shared.js` | `renderTiles`, `renderList`, `startFindPhase`, `resetListItems`, etc. |

### Low

| File | Notes |
|---|---|
| `shared/shapes.js` | `pickCol` color avoidance has state dep; rest static |
| `shared/colouring-common.js` | DOM injection only |
| `filter-bar.js` | `buildFilterBar` DOM-only |
| `colouring-pictures/*.js` | Data-only |
| `connect-the-dots/shapes/*.js` | Data-only (16 files) |
