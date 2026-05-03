# Testing — Ways of Working

## Two layers

| Layer | Tool | Command |
|-------|------|---------|
| Unit | Vitest | `npm run test:unit` |
| End-to-end | Playwright | `npm test` |

Both run in CI on every PR. Both must pass.

---

## Playwright — what it covers

User journeys that require a real browser:

- Page loads and navigation (home, section indices, activity pages)
- UI interactions: canvas drawing, tap sequences, button flows
- Activity completion paths (correct answer → banner → next round)
- Integration: HTML wiring, script loading, correct DOM structure

**Location:** `tests/` (excluding `tests/unit/`)

---

## Vitest — what it covers

Pure logic with no DOM dependency:

- Data transformation functions (`flattenCatalogs`, colour mix lookups)
- String utilities (`escHtml`, sort comparators)
- Time/grid calculations when extracted from DOM-coupled files
- Fetch error handling (using `vi.stubGlobal('fetch', ...)`)
- Edge cases: empty input, unknown values, boundary conditions

**Location:** `tests/unit/`

**How to add a new unit test:**
1. Confirm target function has zero DOM calls
2. Add shim at bottom of source file: `if (typeof module !== 'undefined') module.exports = { fn }`
3. If function is inside an IIFE, move it above the IIFE first (only if it has no DOM deps)
4. Create `tests/unit/<name>.test.js`, import via `createRequire`

---

## Not tested

- Static data files (SVG shape definitions, story JSON, colouring pictures)
- CSS / layout / visual appearance
- Audio playback timing
- Game engines with deep DOM coupling — these stay as Playwright user journeys

---

## Constraints

Source files are plain browser scripts (no `import`/`export`). Unit tests load them via `createRequire`. Functions with top-level DOM calls (e.g. `routine.js`) cannot be required directly — extract pure functions to a separate file first before writing unit tests for them.
