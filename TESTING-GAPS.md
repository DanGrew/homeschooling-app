# Testing Gaps — homeschooling-app

_Last updated: 2026-05-04_

---

## Remaining Gaps by Priority

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
| `shared/colouring-common.js` | DOM injection only |
| `filter-bar.js` | `buildFilterBar` DOM-only |
| `colouring-pictures/*.js` | Data-only |
| `connect-the-dots/shapes/*.js` | Data-only (16 files) |
