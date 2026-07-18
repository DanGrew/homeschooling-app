# CI Gates

Every PR to `main` runs these. All must be green. This is the **up-front
checklist** — write code to satisfy them the first time instead of discovering a
failure after pushing. Sources: `.github/workflows/test.yml` and
`.github/workflows/check-manifests.yml`.

One further gate — **mutation** (StrykerJS) — is **not** in CI at all: it runs
locally on demand. See *Mutation gate — local, not CI* below.

## Run everything locally before committing

The static gates (arch + JSON + manifests) are instant and catch most surprises.
The browser gates are slow — run the targeted file, not the whole suite.

```bash
mkdir -p reports

# All 13 architecture rules (instant, no npm install needed)
for r in no-dom-in-core no-ui-imports no-stray-files no-app-exports \
         no-json-in-repo app-index-only no-media-outside-assets \
         no-css-outside-styles no-md-outside-docs no-guard-chain \
         no-filter-conditional no-pure-fn-outside-core \
         no-logic-in-inline-callbacks; do
  node scripts/arch-check.js "$r" "reports/$r.txt" || echo "FAIL: $r"
done

node scripts/check-untested.js                          # every core/ fn needs a unit test
node scripts/check-ui-cyclomatic.js reports/ui-cyc.txt  # UI complexity ceiling
node scripts/check-manifest-files.js reports/mf.txt     # learnings manifest entries exist
node scripts/validate-schemas.js reports/vj.txt         # content JSON vs schemas
node scripts/validate-catalogue-refs.js reports/cr.txt  # learning-catalogue cross-file refs
node scripts/contracts/run.js                           # page contract rules
node scripts/generate-manifests.js && \
  git diff --exit-code content/dictionary/manifests/

npm run test:unit                                       # Vitest
npx playwright test tests/<file>.test.js                # only the file you touched
```

## The gates

| Gate (CI job) | Fails when | Local command |
|---|---|---|
| `coverage` | Vitest unit tests fail | `npm run test:coverage` |
| `check-untested` | a `core/` function has **no** unit test | `node scripts/check-untested.js` |
| `e2e-test` | Playwright journeys fail | `npm test` (slow — prefer one file) |
| `no-dom-in-core` | `core/` uses `document`/`window` | `node scripts/arch-check.js no-dom-in-core <out>` |
| `no-ui-imports` | `core/` imports from `ui/` | `… no-ui-imports <out>` |
| `no-pure-fn-outside-core` | a named fn outside `core/` has params + logic + **no** DOM access | `… no-pure-fn-outside-core <out>` |
| `no-app-exports` | a file in `app/` uses `export` | `… no-app-exports <out>` |
| `app-index-only` | `app/` contains anything but `.html` | `… app-index-only <out>` |
| `no-stray-files` | a file sits outside `core/ui/app/components/styles` | `… no-stray-files <out>` |
| `no-json-in-repo` | a `.json` lives outside `content/` (except `package*.json`, `serve.json`, `.claude/settings.local.json`) | `… no-json-in-repo <out>` |
| `no-media-outside-assets` | image/audio/video outside `assets/` | `… no-media-outside-assets <out>` |
| `no-css-outside-styles` | a `.css` outside `styles/` | `… no-css-outside-styles <out>` |
| `no-md-outside-docs` | a `.md`/`.txt` outside `docs/` (root allows README, TESTING, CLAUDE, ARCHITECTURE, TESTING-GAPS, CONTRACT-VIOLATIONS) | `… no-md-outside-docs <out>` |
| `no-guard-chain` | chained noop-guard dispatch tables in `ui/`/`app/` | `… no-guard-chain <out>` |
| `no-filter-conditional` | `[null]`/`[undefined].filter(...)` sentinel, or a negation filter on a single-element array | `… no-filter-conditional <out>` |
| `ui-cyclomatic` | a `ui/` function exceeds the complexity ceiling | `node scripts/check-ui-cyclomatic.js <out>` |
| `check-manifest-files` | `content/learnings/manifest.json` references missing files | `node scripts/check-manifest-files.js <out>` |
| `validate-json` | content JSON violates its schema (incl. the learning-catalogue index + area schemas) | `node scripts/validate-schemas.js <out>` |
| `validate-catalogue-refs` | a learning-catalogue card has a cross-file ref that doesn't resolve: `area` ≠ its file home, a `curriculum` tag absent from `content/curriculum/criteria.json`, a `playgrounds[].id` missing from the index registry or `app/activities/<id>/`, or a `learningIcons` id absent from the registry | `node scripts/validate-catalogue-refs.js <out>` |
| `check-contracts` | a page breaks a contract rule (activityId, menuBar, speakableUI) | `node scripts/contracts/run.js` |
| `contracts-speakable` | speakable-button contract tests fail | `npx playwright test --config playwright.contracts.config.js` |
| `check-manifests` | generated manifests are stale (`content/dictionary/manifests/`) | `node scripts/generate-manifests.js` then `git diff` |

Each `arch-check` run prints a `SUMMARY:` line and exits non-zero on violations.

## Mutation gate — local, not CI

| Gate | Fails when | Command |
|---|---|---|
| `mutation` (**local only**) | a mutant in `core/**/*-core.js` survives the unit suite | `npm run test:mutation` |

Coverage proves a line *executed*; mutation proves a test would *catch a bug* in
it. StrykerJS (`stryker.config.mjs`) mutates the pure, DOM-free
`core/**/*-core.js` layer by **glob** — a new core module is under the gate
automatically — and reruns the full Vitest unit suite against each mutant.

- **This gate does NOT run in CI, by design.** Mutation is slow (~11.5 min here)
  and CI runs burn GitHub Actions minutes for a signal that lands on `main`
  where no PR-watcher sees it. As of 2026-07-14 every Grew repo runs mutation
  **locally on demand** via `claude-workflow/tools/mutation-all` instead — see
  `tools/mutation-all.md`. **Do not add a `mutation.yml` workflow.** The bar did
  not change; only the trigger did.
- **Target is 100%** (`thresholds: { high: 100, low: 100, break: 100 }`). It
  ships **red** at its baseline — **78.87%** over 5519 mutants (3934 killed, 419
  timed out, 925 survived, 241 no-coverage), ~11.5 min locally. Survivors are
  cleared by a follow-up sweep task.
- **Survivors are resolved, never excluded.** Kill it with a real test, delete
  dead code, or restructure so the gate can see the behaviour. Never lower the
  threshold and never add an "equivalent mutant" exclusion to go green. The only
  legitimate `!`-exception is *structural* — a file the tool cannot meaningfully
  analyse — and it carries a one-line reason in the config.
- A test that re-parses source (`vm`, re-`require`) cannot kill a Stryker
  survivor; restructuring is what kills it.

## Rules that bite most often

- **Layered purity.** `core/` = pure logic, no DOM, no `ui/` imports. `ui/` = DOM
  rendering. `app/` = HTML pages only, no JS/CSS/exports. Put a file in the wrong
  layer and `no-stray-files` / `app-index-only` / `no-app-exports` fail.
- **Pure logic must live in core.** If a function has parameters and real logic
  (a `return`, `Math.*`, numeric computation) and touches **no** DOM, it belongs
  in `core/` — `no-pure-fn-outside-core` enforces it. A thin event handler that
  only reads/writes the DOM is fine in `ui/`.
- **Core function ⇒ unit test.** The moment logic lands in `core/`,
  `check-untested` requires a matching `tests/unit/*.test.js`. Add the test in the
  same change; export the function via the file's `module.exports` shim.
- **Dispatch-table style, not guard chains.** This codebase replaces `if`/`else`
  with boolean dispatch tables and `[x].filter(Boolean).forEach(...)`. Do **not**
  write `[null].filter(...)` sentinels or `[x].filter(fn => !fn)` negations
  (`no-filter-conditional`), or stacked `'true': () => …, 'false': () => {}`
  noop chains (`no-guard-chain`).
- **File homes.** JSON → `content/`, media → `assets/`, CSS → `styles/`,
  `.md`/`.txt` → `docs/` (plus the allowed root files above). New docs like this
  one go under `docs/`.
- **Manifests.** Adding/removing/renaming a learning, lesson, or dictionary entry
  means `node scripts/generate-manifests.js` + commit. See CLAUDE.md "Content
  Manifests" for the `content/learnings/manifest.json` coverage-test coupling.
