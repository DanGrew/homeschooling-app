# Architecture Restructure Plan

## Goal

Split the codebase into three enforced boundaries:

| Layer | Path | Rule | Tests |
|-------|------|------|-------|
| Core | `/core` | No DOM (`document`/`window`), no imports from `/ui` | Vitest |
| UI | `/ui` | DOM/rendering only. Max 80 lines, max 5 `if` statements per file | Playwright |
| App | `/app` | Wiring, pages, HTML entry points | — |

Enforced by `scripts/arch-check.js` via GitHub Actions on every PR (rules: `no-dom-in-core`, `no-ui-imports`, `ui-complexity`).

---

## Current State

The codebase has already begun the split informally. Many files have a `-logic.js` counterpart that is pure and Vitest-tested. These logic files are ready to move to `/core` immediately.

### Existing logic splits (ready for `/core`)

| Logic file | DOM file | Unit tests |
|------------|----------|------------|
| `app/routine/routine-logic.js` | `app/routine/routine.js` | ✓ |
| `app/activities/drawing-dots/engine-logic.js` | `app/activities/drawing-dots/engine.js` | ✓ |
| `app/activities/story-time/player-logic.js` | `app/activities/story-time/player.js` | ✓ |
| `app/activities/word-lesson/word-lesson-logic.js` | _(no DOM counterpart yet)_ | ✓ |
| `app/shared/colour-mixing-logic.js` | `app/shared/colour-mixing-engine.js` | ✓ |
| `app/shared/filter-bar-logic.js` | `app/shared/filter-bar.js` | ✓ |
| `app/shared/shapes-logic.js` | `app/shared/shapes.js` | ✓ |
| `app/shared/shopping-shared-logic.js` | `app/shared/shopping-shared.js` | ✓ |
| `app/dictionary/dictionary.js` | — | ✓ |
| `app/dictionary/dictionary-helpers.js` | — | ✓ |

### Pure data (ready for `/core`)

All shape definition files, colouring picture files, and story metadata:
- `app/activities/connect-the-dots/shapes/*.js` (15 files)
- `app/activities/connect-the-dots/free-svg/**/*.js`
- `app/shared/colouring-pictures/*.js` (5 files)
- `app/activities/story-time/data.js`

### Complexity hotspots (require extraction before moving to `/ui`)

These files are too large/complex to move to `/ui` as-is. The `ui-complexity` check (80 lines / 5 ifs max) would flag them. They need logic extracted first.

| File | Lines | Ifs | Priority | Notes |
|------|-------|-----|----------|-------|
| `app/activities/simulator/engine/engine.js` | 368 | 69 | **Critical** | Entire game state + rendering mixed together |
| `app/routine/routine.js` | 329 | 27 | High | Render and state tangled; logic already split |
| `app/shared/trace-engine.js` | 222 | 21 | High | No logic split exists yet |
| `app/activities/story-time/player.js` | 141 | 12 | Medium | Logic split exists; render layer still dense |
| `app/shared/colour-mixing-engine.js` | 143 | 11 | Medium | Logic split exists; engine still oversized |
| `app/activities/drawing-dots/engine.js` | 215 | 18 | Medium | Logic split exists; rendering is dense |
| `app/shared/shopping-shared.js` | 89 | 8 | Medium | Logic split exists; phase management mixed in |
| `app/shared/piano-shared.js` | 97 | 5 | Low | Web Audio API + DOM mixed; split audio logic |

### `shapes.js` duplication

`app/shared/shapes.js` and `app/shared/shapes-logic.js` are identical. Consolidate to one file before moving.

---

## Target Structure

```
/core
  routine-logic.js
  drawing-dots-logic.js         ← renamed from engine-logic.js
  player-logic.js
  word-lesson-logic.js
  colour-mixing-logic.js
  filter-bar-logic.js
  shapes-logic.js
  shopping-shared-logic.js
  dictionary.js
  dictionary-helpers.js
  simulator-logic.js            ← to be extracted
  trace-logic.js                ← to be extracted
  piano-logic.js                ← to be extracted
  /data
    story-time-data.js
    /connect-the-dots           ← shape definitions
    /colouring-pictures         ← picture definitions

/ui
  routine-ui.js                 ← renamed from routine.js
  drawing-dots-ui.js            ← renamed from engine.js
  player-ui.js                  ← renamed from player.js
  colour-mixing-ui.js           ← renamed from colour-mixing-engine.js
  filter-bar-ui.js              ← renamed from filter-bar.js
  shapes-ui.js                  ← new, if needed
  shopping-shared-ui.js         ← renamed from shopping-shared.js
  piano-ui.js                   ← renamed from piano-shared.js
  trace-engine.js
  colouring-common.js
  menu.js
  simulator-ui.js               ← to be extracted from engine.js

/app
  (existing HTML pages and wiring, unchanged)
```

---

## Phases

### Phase 1 — Move ready files (no code changes)

Move logic files and data files into `/core`. No logic changes, only path updates and import fixes in consuming HTML files.

**Files to move:**
- All logic files from the "existing splits" table above
- All pure data files
- `dictionary.js`, `dictionary-helpers.js`

**Import fix pattern:** Each HTML file loads scripts via `<script src="...">`. Update relative paths. No module bundler — paths must stay valid relative to each HTML file's location.

**Tests to update:** `tests/unit/` imports use relative paths — update each test file to point at `/core/...`.

Deliverable: `/core` exists with all pure-logic files. `arch-check.js no-dom-in-core` and `no-ui-imports` pass cleanly.

---

### Phase 2 — Extract logic from hotspots

For each hotspot, extract pure functions into a new `/core` module. Leave the DOM file in `/app/shared` or `/app/activities` until Phase 3.

**Order:**

1. **`trace-engine.js`** — extract SVG path maths (`samplePath`, `distanceTo`, stroke parsing) into `core/trace-logic.js`. No tests exist yet; write Vitest tests as part of extraction.

2. **`simulator/engine/engine.js`** — extract `_evalCond`, state transition logic, win condition checking into `core/simulator-logic.js`. Simulator already has Vitest tests; extend them.

3. **`routine.js`** — extract render helpers (`renderTimeAxis`, `renderSlotLines`, scroll calculations) into `core/routine-render-logic.js`. Keep event binding in UI file.

4. **`piano-shared.js`** — extract note frequency table and audio context setup into `core/piano-logic.js`. Keep DOM key rendering in UI file.

5. **`player.js`**, **`colour-mixing-engine.js`**, **`drawing-dots/engine.js`**, **`shopping-shared.js`** — these already have logic splits. Audit each to confirm the DOM file is clean enough for `/ui` (≤80 lines, ≤5 ifs). Refactor if not.

---

### Phase 3 — Move DOM files to `/ui`

Once each DOM file passes the `ui-complexity` check (≤80 lines, ≤5 ifs), move it to `/ui`. Update import paths in HTML files.

Do one file at a time. Run `npm run test:unit` and `npm test` after each move.

---

### Phase 4 — Enforce and close gaps

- Enable arch checks as required in branch protection (upgrade from warn to block) — only once all files pass cleanly.
- Add Vitest tests for any `/core` file that lacks them.
- Delete `app/shared/shapes.js` (duplicate of `shapes-logic.js`).

---

## Import path strategy

This app has no bundler — HTML files load scripts directly with `<script src="...">`. When files move to `/core` or `/ui`, all `<script>` tags in HTML files referencing them must be updated.

Pattern: `../../core/shapes-logic.js` relative to the HTML file's depth.

For Vitest tests: imports use Node `require()` or ES module `import`. Update paths in `tests/unit/` to match new locations.

---

## Arch check escape hatches

If a file legitimately needs to break a rule, add the comment and document why:

```js
// arch: allow-dom       — use in /core if DOM access is genuinely unavoidable
// arch: allow-import    — use in /core if /ui import is intentional
// arch: allow-complexity — use in /ui if file complexity is justified
```

Escape hatches should be rare. If a `/core` file needs DOM access it is not a core file.

---

## Progress tracker

| Phase | Status |
|-------|--------|
| Guardrails CI (arch-check.js + workflow) | ✅ Done |
| Phase 1 — Move ready logic/data files | ⬜ Not started |
| Phase 2 — Extract logic from hotspots | ⬜ Not started |
| Phase 3 — Move DOM files to /ui | ⬜ Not started |
| Phase 4 — Enforce and close gaps | ⬜ Not started |
