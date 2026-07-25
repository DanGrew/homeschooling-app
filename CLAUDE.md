# homeschooling-app — root index

The **public** app: the shell and its HTML/SVG activities, for a child aged 3–4. Served as a
static site from GitHub Pages at `https://dangrew.github.io/homeschooling-app/` — **no build
step**. Curriculum thinking and EYFS reference material live in the private `homeschooling`
repo, not here.

## ⛔ Before you implement

- **Work in a worktree off `origin/main`** — never branch-switch the primary checkout.
- Read `docs/TESTING.md` — tight CI checks here; skipping it causes refactor cycles.
- Skim `docs/GATES.md` — every enforced PR gate, and the one command that runs them locally.
- ⛔ **Verify the spec's premise against current code** before building → `docs/NORMS.md`.

Process rules are **claude-workflow**'s, not this repo's:

- `docs/WAYS.md` — worktrees, draft-PR / never-merge, the modes. An index; read the part you need.
- `product-homeschooling/CLAUDE.md` — this product's board, its specs, and its deltas.

## Start here

Root holds only this file and `README.md`; everything else is `docs/`, flat, area in the name.

| name | what it holds | read it when |
|---|---|---|
| `docs/TESTING.md` | the two test layers and how they are worked | ⭐ before your first change |
| `docs/GATES.md` | every enforced PR gate + the one-shot local command | before pushing, or a gate went red |
| `docs/ARCHITECTURE.md` | the three-layer structure — `core/` · `ui/` · pages | placing a new file, or extracting logic |
| `docs/LOCAL.md` | running it locally: the worktree symlink, one port per worktree | you need to see it in a browser |
| `docs/MODULES.md` | every `core/`, `ui/`, `components/`, `content/` module → purpose | ⛔ finding a module — don't keep it resident |
| `docs/PAGES.md` | activity pages → paths → shared deps | ⛔ locating a page — don't keep it resident |
| `docs/VOICE.md` | the voice-interaction system, its CSS contracts and traps | ⭐ touching **any** speakable element |
| `docs/TELEMETRY.md` | the one `learning_completed` event every activity fires | adding or changing an activity |
| `docs/MANIFESTS.md` | regenerating content manifests, and what CI does **not** check | you added, removed or renamed a learning |
| `docs/NORMS.md` | output standards, regression-test rule, the Playwright rule | ⭐ before your first deliverable |
| `docs/BUDGET.md` | the over-target report — generated, and it must drain | you're answering a size flag |

## The shape of the site

| path | what it is |
|---|---|
| `index.html` | root redirect to `app/` |
| `app/index.html` | home page — Lessons / Worksheets / Games tiles |
| `app/lessons/` · `app/worksheets/` · `app/games/` | the three sections; games holds count-shapes, match-colour, match-shape, connect-the-dots and friends |

## True before you open anything

- ⛔ **Every bug fix ships a regression test proven to fail on the old code** — red first, then
  green. Details in `docs/NORMS.md`.
- ⛔ **Never run the full Playwright suite** (`npm test`, ~4 min) without explicit permission —
  run the one file for your feature. CI runs the full suite on every PR.
- ⛔ **Markdown lives in `docs/`** — enforced by the `no-md-outside-docs` gate, which permits
  only `README.md` and this file at the root.
- ⚠️ **Mutation (`npm run test:mutation`) runs locally, never in CI** — it is slow; don't add a
  `mutation.yml`. The Grew-wide sweep is `claude-workflow/tools/mutation-all`.
