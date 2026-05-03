# Testing Gaps — homeschooling-app-2

## Current State
- **Vitest**: installed, one test file (`tests/unit/shopping-shared.test.js`, 12 tests)
- **Playwright**: E2E, ~28 user journeys
- **Missing**: error handling, game engine logic, time/grid calculations

---

## Done

- [x] Vitest setup + CI job
- [x] `app/shared/shopping-shared.js` — `flattenCatalogs`, `escHtml`, `byName`

---

## Next — Pure Function Unit Tests

### `app/shared/colour-mixing-engine.js`
- `mix()` is inside an IIFE — move it above the IIFE first (no DOM deps)
- Then add module.exports shim and test all valid combos + unknown pair → null
- `CM_MIXES` and `CM_COLOURS` already top-level globals — testable directly

### `app/routine/routine.js`
- Has top-level DOM event listeners — cannot require directly
- Extract `toMins`, `buildOrderedDays`, `computeGridRange` to `app/routine/routine-utils.js`
- Then unit test: `toMins("08:30")→510`, midnight, noon, rolling window day ordering

### `app/shared/filter-bar.js`
- Check for top-level DOM calls first
- Test: tag+level filter combos, no matching items edge case

---

## Error Handling Tests

### `app/dictionary/dictionary.js` + `app/dictionary/dictionary-helpers.js`
- Use `vi.stubGlobal('fetch', ...)` to simulate failed fetch
- Test: failed fetch → callback fires, malformed JSON → no silent hang
- Risk: silent failures leave UI in broken state

---

## Game Engine Logic (Playwright or unit after extraction)

### `app/shared/trace-engine.js`
- `_parseStrokes(svgPath)` — valid + malformed paths
- `_updateDistance()` — ball near/far from path
- Completion detection at 100%
- DOM-coupled — likely Playwright-only unless extracted

### `app/activities/simulator/engine/engine.js`
- `_handleTap()` state transitions, `_selectTool()` — valid/invalid tool ids
- Deeply DOM-coupled — Playwright touch tests via `page.touchscreen`

### `app/activities/drawing-dots/engine.js`
- Point proximity detection, out-of-order tap validation
- DOM-coupled — Playwright

---

## Suggested Next Session Order

1. Move `mix()` out of IIFE → add shim → test `colour-mixing-engine.js`
2. Extract `routine-utils.js` → test `toMins` + `buildOrderedDays`
3. Check + test `filter-bar.js`
4. Test `dictionary.js` error paths with `vi.stubGlobal`
5. Add Playwright touch tests for simulator engine
