# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## STOP — Read Before Implementing

Before any implementation:
1. Make a **worktree off `origin/main`** and work there — never branch-switch the primary checkout (see Git and GitHub below)
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

## Guidelines

Full session guidelines (output standards, token efficiency, ways of working) are maintained in the private `homeschooling` repo. If working in this repo, ask the user to paste the relevant sections from there before starting.

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

**Run the app locally (no IntelliJ needed) — serve from the worktree you're working in, so what you see is *that worktree's* code:**
```bash
PORT=3001 node test-server.js     # run this FROM the worktree dir → http://localhost:3001/
```
Static site, no build step. `test-server.js` serves **its own directory** via `serve-handler` and strips the `/homeschooling-app` GitHub-Pages path prefix, so both `http://localhost:3001/` and `http://localhost:3001/homeschooling-app/...` resolve (the latter matches the deployed Pages URL). Open `/` → redirects to `app/`. First run needs `npm install` (pulls `serve-handler` via the `serve` dep).

**One port per worktree — never reuse a server across worktrees.** Each worktree serves only its own files, so a server on `:3000` from another tree (or IntelliJ's autostart) will show you the *wrong* worktree's code. Pick a distinct `PORT` per worktree and hand the user that exact URL when they need to test your branch — they can't `git checkout` your worktree from the shared checkout, so a running server pointed at the worktree is how they see your change. Same rule for Playwright: it reads `PORT`/a `.port` file (default 3000) and will `reuseExistingServer` locally — set a per-worktree `PORT` (or `.port`) so a test run can't silently hit another tree's server.

## Git and GitHub

**All dev goes in a worktree off `origin/main` — never branch-switch a shared checkout.** Concurrent Claude sessions and any running local server share the primary checkout; switching its branch (or `git checkout -b` in it) moves the branch pointer and reverts the working tree mid-edit, and a stash/checkout slip can silently land a commit on `main`. A worktree pins HEAD per directory so that can't happen:
```bash
git worktree add ../homeschooling-app-<topic>-wt origin/main -b <topic>/<descriptor>
```
Commit, push, raise a **draft PR**. (Supersedes the old "new branch in the checkout" + second-clone `homeschooling-app-2` model.)

**Never delete a worktree before its PR is merged**, and never delete one you didn't create — unmerged work in it is unrecoverable, and another session/the user may be serving from it. Cleanup is a separate step the user authorises after merge ("merged, you can delete it now").

**PRs:** Always draft (`--draft`), one per logical unit, merge target always `main`.
**Never merge a PR.** Take work to green CI / ready-for-review, then STOP and hand back. The user reviews and merges. `gh pr merge`, the merge button, and auto-merge are all off-limits. After you open a PR, wait for the user to merge it before starting the next task.

**Always end a reply that opens PR(s) with a scannable numbered block** — one line each: repo + PR number + one-line title + full URL, plus any co-deploy/merge-order note. Never bury a PR link mid-paragraph.

## Working Norms

- **Discussing a task ≠ go-ahead.** Wait for an explicit "build it"; before starting, fetch and confirm the task isn't already merged.
- **`git status` clean-check before every commit** — edits made after `git add` are unstaged and silently dropped from the commit.
- **Blocked 2–3× in a row? Question the approach** — surface alternatives before pushing on or installing anything.

## Keep Docs Current

Hit a stale `CLAUDE.md`/doc while working (wrong path, renamed file, changed command/port/gate, superseded rule)? Fix it in the **same PR** — don't leave it for later and don't ask first; low-risk and expected. When a session uncovers a durable repo gotcha (a shared module to keep optional-safe, a non-obvious build/test step, a constraint that just caused a bug), write it into the relevant checked-in doc — **not (only) memory**, which auto-recalls unreliably and isn't visible to other contributors.

## Tooling

**gh CLI:** may not be on PATH in bash — use the full path (find it with `which gh`; e.g. `/opt/homebrew/bin/gh` on macOS, `"/c/Program Files/GitHub CLI/gh.exe"` on Windows).
**Parallel agents:** `gh pr create` is blocked in the agent sandbox — PR creation must always be done from the main session after agents complete.

## Content Manifests

`node scripts/generate-manifests.js` regenerates generated manifests from the content files, including `content/learnings/manifest.json`, `content/lessons/index.json`, and `content/dictionary/manifests/`. Run it and commit the result after adding/removing/renaming any learning, lesson, or dictionary entry.

**Gotcha:** the `check-manifests` CI gate only diffs `content/dictionary/manifests/` and `content/lessons/index.json` — it does **not** verify `content/learnings/manifest.json`. That manifest can therefore drift silently (stale entries for deleted content). Two downstream effects:
- The Curriculum Coverage page (`app/curriculum/`) builds its tables from `content/learnings/manifest.json`.
- `tests/curriculum.test.js` hard-codes the lesson/exercise row counts. When learnings change, regenerate the manifest AND update those counts, or the `e2e-test` CI job fails on a row-count mismatch.

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

## Token Efficiency

One session = one issue/activity; scope prompts to one file or concern; `/compact` before switching concerns. Caveman is installed globally (Lite for collaboration, Full/Ultra for SVG/HTML/Markdown generation). Fuller token/ways-of-working guidance is canonical in the private `homeschooling` repo CLAUDE.md.

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
