# Architecture

## Three-layer structure

| Layer | Path | Role | Tests |
|-------|------|------|-------|
| Core | `/core` | Pure logic — no DOM, no `document`, no `window` | Vitest (`npm run test:unit`) |
| UI | `/ui` | DOM rendering only — imports from core, no logic | Playwright (`npm test`) |
| App | `/app` | HTML pages and wiring — imports from both | — |

No bundler. Files are served directly. All imports are relative paths.

Enforced by `scripts/arch-check.js` and `scripts/check-ui-cyclomatic.js` via GitHub Actions on every PR.

---

## Automated checks

These rules run on every PR.

### `no-dom-in-core`
Scans every `.js` file in `/core`.
Fails if any file contains `document` or `window`.
Core files must be pure functions — no browser globals.

### `no-ui-imports`
Scans every `.js` file in `/core`.
Fails if any file imports from a path containing `/ui/`.
Core must not depend on UI.

### `no-stray-files`
Scans all `.js` files in the repo.
Fails if any file is outside `core/`, `ui/`, `app/`, `scripts/`, `tests/`, `.github/`.
Forces all new JS into an owned layer.

### `no-app-exports`
Scans every `.js` file in `/app`.
Fails if any file contains a top-level `export` statement.
If a file exports, it's reusable and belongs in `core/` or `ui/`, not `app/`.

### `colouring-zorder-svg-sync` (preferred fix tool)
Syncs `colouring.json` shape order to the original SVG document order — no heuristics.
SVG elements render in document order; this script uses that as ground truth.

Requires the source SVG files from the `homeschooling` repo under `designs/`.
Matches shapes by `d`/`cx`/`cy` attributes. Unmatched shapes (manually added) go to end.

Run: `npm run sync:zorder` (report) or `npm run sync:zorder -- --apply` (fix)
Pass `--designs /path/to/designs` if the homeschooling repo is elsewhere.
Pass `--concept camel` to target one entry.

### `colouring-zorder` (heuristic fallback — use when source SVG unavailable)
Scans every `colouring.json` in `/content/dictionary/entries/`.
Flags pairs of overlapping shapes where a larger shape renders on top of a smaller one,
or a colourable shape covers a fixed/noColour decoration of similar size.

The colouring renderer appends shapes in array order — SVG painter algorithm means later
shapes render on top. A misplaced large shape can obscure details the child is meant to see.

Run: `npm run audit:zorder`

Fix: `npm run audit:zorder -- --apply` sorts each flagged file's shapes by bounding box
area descending (large background shapes first, small detail shapes last). Review visually
after applying — the heuristic is good but not perfect for highly concave paths.

### `ui-cyclomatic`
Scans every `.js` file in `/ui` using ESLint's `complexity` rule (AST-based).
Fails if any **function** has a cyclomatic complexity above **1** — meaning zero branches per function.
Threshold 1 means: every UI function must be a pure sequence. No `if`, no `? :`, no `&&`/`||` used for control flow, no loops with break/continue.
This is intentional: if a UI function needs to make a decision, that decision belongs in `core/` where Vitest can test it. UI = state-in → DOM-out.

### Escape hatches
Add a comment to suppress a specific check for one file:

```js
// arch: allow-dom        — file in /core that legitimately uses DOM
// arch: allow-import     — file in /core that intentionally imports from /ui
// arch: allow-complexity — file in /ui whose cyclomatic complexity is justified (suppresses ui-cyclomatic check)
// arch: allow-export     — file in /app that legitimately exports (rare)
```

Use sparingly. If a `/core` file needs DOM access it is not a core file.

---

## Check integrity — do not game the rules

The checks exist to enforce architecture, not to be beaten. A passing check should mean the code is better; not that you found a way to satisfy the assertion without fixing the underlying design.

**What gaming looks like:**

```js
// WRONG — removing a guard to pass the complexity check
// The guard existed because _audioBuffers[note] can be undefined (network failure).
// Deleting it makes the check pass but silently breaks the app on bad networks.
function playNote(noteName, volume) {
  // if (!_audioBuffers[noteName]) return;  ← deleted just to hit complexity 1
  var src = _audioCtx.createBufferSource();
  src.buffer = _audioBuffers[noteName]; // throws if undefined
  ...
}

// WRONG — pre-filling with a dummy value to avoid the guard
// The problem is not the guard. The problem is the function has a decision.
var _audioBuffers = PIANO_CONFIG.NOTES.reduce((acc, note) => {
  acc[note] = _audioCtx.createBuffer(1, 1, 22050); // silent decoy
  return acc;
}, {});
```

**What a genuine fix looks like:**

Move the decision to `core/`, or restructure so the decision is never needed:

```js
// CORRECT — initAudio guarantees _audioBuffers[note] is always a valid buffer
// before playNote is ever reachable. Guard is structurally unnecessary.
// If decode fails, note stays as the silent fallback set during init.
initAudio().then(() => playNote(note, 1.0));

// CORRECT — glowKey uses a lookup table; no decision in UI
var GLOW_BG = { hit: '#FFD700', miss: '#FF4444' };
keyEl.style.background = GLOW_BG[type]; // core config, not a branch
```

If you genuinely cannot eliminate a branch — because it represents a real browser API constraint or an unavoidable lifecycle decision — use the escape hatch with a comment explaining the specific reason. The comment is the contract: it must name the function and explain why the decision cannot live in core.

```js
// arch: allow-complexity
// initAudio: lazy AudioContext creation requires a user gesture (browser spec);
// _initPromise memoisation prevents re-decoding on every keypress.
// Both || operators are browser lifecycle constraints, not moveable to core.
```

---

## Import path rules

No bundler means paths must be explicit. Depth depends on where the importing file lives.

| Importing file location | Path to `/core` | Path to `/ui` |
|------------------------|-----------------|---------------|
| `app/activities/FOO/` | `../../../core/` | `../../../ui/` |
| `app/shared/` | `../../core/` | `../../ui/` |
| `app/routine/` | `../../core/` | `../../ui/` |
| `ui/<layer>/` | `../../core/` | — |

---

## Adding a new activity

**1. Core logic** — `core/<activity>/<activity>-core.js`

```js
export function myPureFunction(input) {
  // no document, no window
  return result;
}
// Add CJS shim if the file is loaded as a plain <script> (no type="module"):
if (typeof module !== 'undefined') module.exports = { myPureFunction };
```

**2. Unit tests** — `tests/unit/<activity>-core.test.js`

```js
import { myPureFunction } from '../../core/<activity>/<activity>-core.js';
describe('myPureFunction', () => { ... });
```

**3. UI rendering** — `ui/<activity>/<activity>-ui.js`

```js
import { myPureFunction } from '../../core/<activity>/<activity>-core.js';
export function renderSomething(container) {
  // DOM manipulation only — no pure logic here
}
```

Must pass `ui-cyclomatic` (complexity 1 per function — zero branches). Move all decisions into core first.

**4. HTML wiring** — `app/activities/<activity>/index.html`

```html
<script type="module">
  import { renderSomething } from '../../../ui/<activity>/<activity>-ui.js';
  renderSomething(document.getElementById('container'));
</script>
```

**5. Playwright tests** — `tests/games/<activity>.test.js`

Cover the user journey, not implementation details. Minimum set:

- Page loads with expected elements visible
- Correct answer: `feedback-correct` class appears, success banner slides up
- Wrong answer: `feedback-wrong` class appears, clears after ~500ms (use `timeout: 2000` to avoid flakes)
- Next button on banner: banner hides, new round renders

If state needs to be inspected (e.g. which answer is correct), expose a getter via `window.__<activity>Target` in the app HTML — not directly in core/ui.

**6. Games hub tile** — `app/games/index.html`

Add a tile linking to the new activity. Update `tests/games/index.test.js` to assert the tile and its section heading are visible.

---

## Modifying existing files

**Changing pure logic** — edit `core/<activity>/<activity>-core.js`, run `npm run test:unit`.

**Changing DOM rendering** — edit `ui/<activity>/<activity>-ui.js`, run `npm test`. Any branching logic must live in core — UI functions must be pure sequences (cyclomatic complexity 1).

**Changing page wiring** — edit the HTML in `app/`. Run `npm test`.

Both test suites must pass before merging.

---

## Playwright test conventions

**Never use `waitForTimeout` or hardcoded timeouts.** Fixed sleeps are flaky in CI — execution speed varies across machines and worker counts.

Wait for DOM state instead:

```js
// wait for CSS transition to complete (e.g. banner slide-in)
await expect(page.locator('#success-banner')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')

// wait for animated CSS property
await expect(page.locator('#reference-img')).toHaveCSS('opacity', '1')

// wait for element to appear
await page.waitForSelector('#tray-bar img')

// wait for arbitrary JS condition
await page.waitForFunction(() => document.getElementById('foo')?.dataset.ready === 'true')
```

`toHaveCSS`, `waitForSelector`, and `waitForFunction` poll until the condition is met — they return as soon as it is true, and they fail only if the default timeout (5 s) elapses without success.

---

## Current layer contents

### `/core`
`colour-mixing`, `connect-the-dots`, `colouring`, `dictionary`, `drawing-dots`, `filter-bar`, `piano`, `routine`, `shapes`, `shopping`, `simulator`, `story-time`, `trace`, `word-lesson`

### `/ui`
`colour-mixing`, `colouring`, `filter-bar`, `piano`, `shopping`, `trace`

---

## Running checks locally

```sh
npm run test:unit                                                   # Vitest
npm test                                                            # Playwright
node scripts/arch-check.js no-dom-in-core    reports/out.txt
node scripts/arch-check.js no-ui-imports     reports/out.txt
node scripts/arch-check.js ui-complexity     reports/out.txt
node scripts/arch-check.js no-stray-files    reports/out.txt
node scripts/arch-check.js no-app-exports    reports/out.txt
node scripts/check-ui-cyclomatic.js          reports/out.txt
npm run sync:zorder                            # sync colouring z-order from source SVGs (preferred)
npm run sync:zorder -- --apply               # write fixes
npm run audit:zorder                           # heuristic z-order audit (no SVG required)
npm run audit:zorder -- --apply               # heuristic fix (review visually after)
```
