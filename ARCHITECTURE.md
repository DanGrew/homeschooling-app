# Architecture

## Three-layer structure

| Layer | Path | Role | Tests |
|-------|------|------|-------|
| Core | `/core` | Pure logic — no DOM, no `document`, no `window` | Vitest (`npm run test:unit`) |
| UI | `/ui` | DOM rendering only — imports from core, no logic | Playwright (`npm test`) |
| App | `/app` | HTML pages and wiring — imports from both | — |

No bundler. Files are served directly. All imports are relative paths.

Enforced by `scripts/arch-check.js` via GitHub Actions on every PR (rules: `no-dom-in-core`, `no-ui-imports`, `ui-complexity`).

---

## Automated checks

Three rules run on every PR.

### `no-dom-in-core`
Scans every `.js` file in `/core`.
Fails if any file contains `document` or `window`.
Core files must be pure functions — no browser globals.

### `no-ui-imports`
Scans every `.js` file in `/core`.
Fails if any file imports from a path containing `/ui/`.
Core must not depend on UI.

### `ui-complexity`
Scans every `.js` file in `/ui`.
Fails if any file exceeds **80 lines** or **5 `if(` occurrences**.
Keeps UI files as thin rendering layers. Use `&&` short-circuit and ternary instead of `if` blocks to stay within the limit.

### Escape hatches
Add a comment to suppress a specific check for one file:

```js
// arch: allow-dom        — file in /core that legitimately uses DOM
// arch: allow-import     — file in /core that intentionally imports from /ui
// arch: allow-complexity — file in /ui whose complexity is justified
```

Use sparingly. If a `/core` file needs DOM access it is not a core file.

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

Must stay within **80 lines / 5 ifs**. Use `&&` short-circuit and ternary instead of `if` blocks.

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

**Changing DOM rendering** — edit `ui/<activity>/<activity>-ui.js`, run `npm test`. If the file is already at 5 ifs, use `&&`/ternary for new branches.

**Changing page wiring** — edit the HTML in `app/`. Run `npm test`.

Both test suites must pass before merging.

---

## Current layer contents

### `/core`
`colour-mixing`, `connect-the-dots`, `colouring`, `dictionary`, `drawing-dots`, `filter-bar`, `piano`, `routine`, `shapes`, `shopping`, `simulator`, `story-time`, `trace`, `word-lesson`

### `/ui`
`colour-mixing`, `filter-bar`, `piano`, `shopping`

### `/app/shared` (DOM files not yet moved to `/ui`)
`colouring-common.js`, `trace-engine.js`

These are candidates for `/ui` once they pass the complexity check (≤80 lines, ≤5 ifs).

---

## Running checks locally

```sh
npm run test:unit                                                   # Vitest
npm test                                                            # Playwright
node scripts/arch-check.js no-dom-in-core reports/arch.json
node scripts/arch-check.js no-ui-imports  reports/arch.json
node scripts/arch-check.js ui-complexity  reports/arch.json
```
