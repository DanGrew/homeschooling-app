# Testing Gaps — homeschooling-app-2

## Current State
- **Vitest**: installed, 8 test files, 175 tests passing
- **Playwright**: E2E, ~28 user journeys
- **Coverage**: failing thresholds — DOM-coupled code counted against logic coverage

---

## Done

- [x] Vitest setup + CI job
- [x] `shopping-shared.js` — `flattenCatalogs`, `escHtml`, `byName`, state fns
- [x] `colour-mixing-engine.js` — `mix`, `hex`, `CM_COLOURS`, `CM_MIXES`
- [x] `filter-bar.js` — `extractTags`, `extractLevels`, `filterItems`
- [x] `routine.js` — `toMins`, `getTodayKey`, `buildOrderedDays`
- [x] `dictionary.js` + `dictionary-helpers.js` — fetch error paths
- [x] `shapes.js` — `svg`, `pickCol` (module.exports shim added)

---

## The Plan — `-logic` File Split

**Goal:** every file with mixed DOM + logic gets its pure functions extracted to a
`<name>-logic.js` sibling. Vitest coverage targets only `**/*-logic.js` files.
This makes 80%+ thresholds achievable and meaningful.

### Pattern for each file

1. Create `<name>-logic.js` — pure functions only, `module.exports = { ... }`
2. Original file imports from `-logic.js` and uses the functions
3. Move/update unit test to import from `-logic.js`
4. Update `vitest.config.js` coverage include to `app/**/*-logic.js`

### Files to split

| File | Pure fns to extract | Status |
|------|---------------------|--------|
| `app/shared/shapes.js` | `svg`, `pickCol`, `colours`, `types` | shim added, needs extract |
| `app/shared/colour-mixing-engine.js` | `mix`, `hex`, `CM_COLOURS`, `CM_MIXES` | shim added, needs extract |
| `app/shared/filter-bar.js` | `extractTags`, `extractLevels`, `filterItems` | shim added, needs extract |
| `app/shared/shopping-shared.js` | `flattenCatalogs`, `escHtml`, `byName`, state fns | ES module, needs extract |
| `app/routine/routine.js` | `toMins`, `getTodayKey`, `buildOrderedDays` | shim added, needs extract |

### Files that stay DOM-only (no `-logic` needed, exclude from coverage)

- `app/shared/colouring-common.js`
- `app/shared/menu.js`
- `app/shared/piano-shared.js`
- `app/shared/trace-engine.js`
- `app/activities/drawing-dots/engine.js`
- `app/activities/simulator/engine/engine.js`
- `app/activities/simulator/engine/loader.js`
- `app/activities/story-time/player.js`

### Vitest config change

```js
coverage: {
  include: ['app/**/*-logic.js'],
  // remove the broad app/**/*.js include
}
```

---

## Session Order

1. Extract each file in the table above → create `-logic.js` sibling
2. Update each unit test to import from `-logic.js`
3. Update `vitest.config.js` coverage include
4. Verify thresholds pass

---

## Playwright-only (no unit tests possible)

- `trace-engine.js` — every method uses SVG DOM APIs
- `simulator/engine.js` — deeply DOM-coupled
- `drawing-dots/engine.js` — DOM-coupled
- `story-time/player.js` — DOM-coupled
