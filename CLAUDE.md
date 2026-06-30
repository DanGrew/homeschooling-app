# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## STOP — Read Before Implementing

Before any implementation:
1. Make a **worktree off `origin/main`** and work there — never branch-switch the primary checkout (see *Working rules* below — the full process lives in claude-workflow)
2. Read `TESTING.md` — this repo has tight CI quality checks; skipping this causes refactor cycles
3. Skim `docs/CI-GATES.md` — the full list of enforced PR gates (architecture rules, layer/file-home rules, the core-function-needs-a-unit-test rule, contracts, manifests) and the one-shot local command to run them all before committing. Writing to these up front avoids post-push refactor cycles.
4. **Verify the spec's premise against current code before building.** Specs can go stale as the code moves on. If a spec assumes behaviour that no longer holds (e.g. it assumes objects spawn stacked but the add button now spawns at spread positions), do not silently implement around it — confirm with the user whether the task is still relevant; they often already know. A wrong premise means wasted build/test/revert cycles.

## Project

Public-facing homeschooling app. Activities built for a child aged 3–4. This repo contains only the app shell and HTML/SVG activities — curriculum thinking and EYFS reference material lives in the private `homeschooling` repo.

**Architecture:** app is a static site served via GitHub Pages at `https://dangrew.github.io/homeschooling-app/`. No build step — files are served directly, relative links work as-is.

## Repository Structure

- `index.html` — root redirect to `app/`
- `app/index.html` — home page (Lessons / Worksheets / Games tiles)
- `app/lessons/` — lessons section
- `app/worksheets/` — worksheets section
- `app/games/` — games activities (count shapes, match colour, match shape, connect the dots, etc.)

## Working rules (process) — read claude-workflow first

This is a **code repo**; it holds homeschooling-app **code specifics only**. The
shared **process** rules — worktrees, draft-PR / never-merge, the workflow modes +
state machine, working norms, keep-docs-current, token efficiency — live in
**claude-workflow**, the single source of truth. Read
`/Users/dan/dan-grew-repos/claude-workflow/homeschooling/CLAUDE.md` (the
homeschooling entry) → `WAYS-OF-WORKING.md`. Don't restate those rules here.

## Output Standards

- SVG: no comments, no decorative whitespace, no `id`/`class` unless needed for CSS
- HTML: inline styles only, no unused rules, no comments
- Markdown: no preamble, no trailing summaries — content only

Return only the generated output unless explanation is explicitly requested.

## Testing

See `TESTING.md` for full ways of working. Summary:
- **Vitest** (`npm run test:unit`) — pure functions, no DOM, `tests/unit/`
- **Playwright** (`npm test`) — user journeys, browser interactions, `tests/`
- Both required to pass on every PR.

**Never run the full Playwright suite (`npm test`) without explicit user permission.** Full suite takes ~4 minutes. Run only the specific test file for the feature under development: `npx playwright test tests/<file>.test.js`. CI runs the full suite on every PR.

**Every bug fix ships a regression test proven to fail on the old code.** Write the test, watch it fail *before* the fix, then make it pass — don't wait to be asked. A fix without a red-then-green test isn't done.

**First-time setup before running tests:** `npm install`, then `npx playwright install chromium` (the browser binary is not vendored). Playwright auto-starts its own web server (`webServer` in `playwright.config.js`) — you do NOT need to start a server to run tests.

**Fresh worktree needs `node_modules` before the server or tests run.** A worktree starts with no `node_modules`, and `test-server.js` does `require('./node_modules/serve-handler')` *relative to the script dir* — so the worktree itself must have one, even with the no-`cd` run form. Symlink the primary checkout's instead of a fresh `npm install`:
```bash
ln -sfn /abs/path/to/homeschooling-app/node_modules /abs/path/to/<worktree>/node_modules
```
`.gitignore` ignores `node_modules` (no trailing slash) so the symlink is **not** committed — never `rm` it to "clean" before a commit; `git add -A` is already safe. Deleting it is what breaks `node test-server.js` with `Cannot find module './node_modules/serve-handler'`.

**Run the app locally (no IntelliJ needed) — serve from the worktree you're working in, so what you see is *that worktree's* code. Always give the no-`cd` form: pass `test-server.js` by its absolute path, never `cd` into the worktree first** (a `cd` in a compound command triggers a permission prompt):
```bash
PORT=3001 node /abs/path/to/<worktree>/test-server.js     # → http://localhost:3001/
```
Static site, no build step. `test-server.js` serves **its own directory** (`public: __dirname`) and `chdir`s to it on startup via `serve-handler`, so the directory served is wherever the *script file* lives — pointing `node` at the worktree's `test-server.js` serves that worktree regardless of your shell's cwd, no `cd` needed (and it still works if your shell's launch dir was since deleted — e.g. a cleaned-up worktree). It strips the `/homeschooling-app` GitHub-Pages path prefix, so both `http://localhost:3001/` and `http://localhost:3001/homeschooling-app/...` resolve (the latter matches the deployed Pages URL). Open `/` → redirects to `app/`. First run needs `npm install` (pulls `serve-handler` via the `serve` dep).

**One port per worktree — never reuse a server across worktrees.** Each worktree serves only its own files, so a server on `:3000` from another tree (or IntelliJ's autostart) will show you the *wrong* worktree's code. Pick a distinct `PORT` per worktree and hand the user that exact URL when they need to test your branch — they can't `git checkout` your worktree from the shared checkout, so a running server pointed at the worktree is how they see your change. Same rule for Playwright: it reads `PORT`/a `.port` file (default 3000) and will `reuseExistingServer` locally — set a per-worktree `PORT` (or `.port`) so a test run can't silently hit another tree's server.

**Servers are on-demand, one per worktree, stopped when done — not always-on.** A worktree is just files; nothing serves it until someone starts a server. When a change needs the user to eyeball it, the hand-off MUST give them the copy-paste **start command** and the **URL**, and tell them to **stop it when done**. Don't start one speculatively, and don't leave stale servers running across worktrees (that's how the wrong-tree-on-`:3000` mixup happens). Template:
```bash
# start — pass the worktree's test-server.js by absolute path (no cd):
PORT=3007 node <worktree-path>/test-server.js     # → http://localhost:3007/app/...
# stop when done:  Ctrl-C  (or, if backgrounded:)  lsof -ti:3007 | xargs kill
```
Any server *you* (the agent) start during a session, tear down before ending the session unless the user still has it open to test.

## Tooling

(`gh` CLI path + general tooling: see claude-workflow `WAYS-OF-WORKING.md`.)
**Parallel agents:** `gh pr create` is blocked in the agent sandbox — PR creation must always be done from the main session after agents complete.

## Content Manifests

`node scripts/generate-manifests.js` regenerates generated manifests from the content files, including `content/learnings/manifest.json` and `content/dictionary/manifests/`. Run it and commit the result after adding/removing/renaming any learning or dictionary entry. (The old `content/lessons/` format and its `index.json` were retired — all activities use `content/learnings/`.)

**Gotcha:** the `check-manifests` CI gate only diffs `content/dictionary/manifests/` — it does **not** verify `content/learnings/manifest.json`. That manifest can therefore drift silently (stale entries for deleted content). It still feeds the `check-manifest-files` gate (every entry must point to an existing file), so always regenerate after adding/removing learnings. The Curriculum Coverage page (`app/curriculum/`) and `tests/curriculum.test.js` now build from the learning catalogue (`content/learning-catalogue/`), not this manifest, so manifest drift no longer breaks them.

## Guidance + Page Control Pattern

Activities that use the guidance system (`components/guidance/guidance-service.js`) communicate with the page via two custom events on `window`:

**`guidance:event`** — page → guidance. Fired by the page when the child does something (taps, selects, etc.). Guidance checks against the current step's `expect` and advances if matched.
```js
window.dispatchEvent(new CustomEvent('guidance:event', { detail: { type: 'PRESET_WAKE_UP_SELECTED' } }));
```

**`page:control`** — guidance → page. Fired by guidance to instruct the page to change state. Two sources:
- `lesson.pageControls[]` — fires once on lesson start
- `step.pageControls[]` — fires on each step load
- `PAGE_CONTROL_RESET` — always fires on lesson stop

The page registers a `PAGE_CTRL` map and listens:
```js
var PAGE_CTRL = {
  'HIDE_SOMETHING': function() { ... },
  'PAGE_CONTROL_RESET': function() { ... }
};
window.addEventListener('page:control', function(e) {
  if (e.detail.type in PAGE_CTRL) PAGE_CTRL[e.detail.type]();
});
```

**Rule:** never modify `guidance-service.js` to add new behaviour. All page-specific logic goes in the page's `PAGE_CTRL` map. New controls are just new string keys.

**Step matching:** a step's `expect` is either a single event string, or an array of event strings (array = ALL listed events must be collected before the step advances; progress shows as dots). Each `guidance:event` is handled independently and advances at most one step.

**Cascade gotcha:** one user action can dispatch several guidance events in sequence (e.g. a single object tap fires `OBJECT_SELECTED` and then `DIFFERENT_OBJECT_SELECTED`). If consecutive steps expect those events, a single action can advance multiple steps at once — looking like skipped steps. Guard by resetting page-local interaction state (e.g. `lastSelectedId`) on `CLEAR_CANVAS` / `PAGE_CONTROL_RESET` so a lesson starts clean and the first action fires only the intended event.

## Page Index

Full table of activity pages → paths → shared deps lives in **`docs/PAGE-INDEX.md`**. Read it when you need to locate a page or its dependencies; don't keep it resident.

## Telemetry Pattern

All activities record a `learning_completed` event at session end using `recordLearningEvent` from `core/telemetry/learning-events.js`. Reference implementation: `ui/colouring-playground/colouring-playground-ui.js`.

```js
import { recordLearningEvent } from '../../core/telemetry/learning-events.js';

var eventFired = false;

function onActivityComplete() {
  if (eventFired) return;
  eventFired = true;
  recordLearningEvent({
    version: 1,
    type: 'learning_completed',
    timestamp: Date.now(),
    learning_id: 'activity-id',   // stable string identifying the activity/mode
    variant_id: variantId,        // e.g. content pack, puzzle id, catalog — omit if no variant
    activity_id: 'activity-id'    // same as learning_id unless activity has sub-modes
  });
}

function onReset() {
  eventFired = false;  // allow re-fire after reset/play-again
}
```

**Rules:**
- One event per completed session — guard with `eventFired` flag
- Reset flag on play-again / reset
- No intermediate events (taps, matches, etc.) — completion only
- Events stored in IndexedDB; visible on learnings page (`app/learnings/index.html`)

## Module Index

Full table of every `core/`, `ui/`, `components/`, and `content/` module → purpose lives in **`docs/MODULE-INDEX.md`**. Read it when you need to find the right module; don't keep it resident.
