# Testing — Ways of Working

> **Full enforced-gate list:** see `docs/CI-GATES.md`. It covers everything CI
> checks beyond the two test layers below — the architecture rules (incl.
> `no-pure-fn-outside-core`), file-home rules, the rule that every `core/`
> function needs a unit test, page contracts, and manifest freshness — plus a
> one-shot command to run them all locally before committing.

## Two layers

| Layer | Tool | Command |
|-------|------|---------|
| Unit | Vitest | `npm run test:unit` |
| End-to-end | Playwright | `npm test` |

Both run in CI on every PR. Both must pass.

---

## Playwright — local setup

Playwright uses a persistent local server rather than spinning one up per run. This keeps pre-push fast even for a few tests.

**First time / new terminal:**
```bash
PORT=3000 node test-server.js &
```
Leave it running. Playwright will reuse it on every subsequent run.

**Multiple worktrees:** each worktree needs its own port. Add a `.port` file in the worktree root (gitignored):
```
3001
```
The pre-push hook reads it automatically. Start that worktree's server:
```bash
PORT=3001 node test-server.js &
```

**CI** always starts a fresh server — no action needed.

**If tests fail to connect:** server has died. Restart it with the correct `PORT` for that worktree.

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

`/core` files use ES module syntax (`export function`). Unit tests import them directly. Files that need a CJS shim for Vitest add `if (typeof module !== 'undefined') module.exports = { ... }` at the bottom and load via `createRequire`. Functions with top-level DOM calls cannot be unit-tested directly — extract pure logic to a `/core` file first.
