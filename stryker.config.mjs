// StrykerJS mutation-testing gate for homeschooling-app.
// Runs the Vitest unit suite against each mutant to prove the tests actually
// *catch* a regression, not merely execute the line. Coverage already enforces
// "executed" (vitest.config.js floors); this enforces "asserted".
//
// Scope is a DISCOVERY RULE, not an allowlist: mutate every `*-core.js` under
// core/ — the pure, DOM-free layer guarded by the `no-dom-in-core` arch gate,
// which is the ideal mutation target (deterministic, fast, no I/O). Adding a new
// core module puts it under the gate automatically. There are no exceptions
// today; any future `!`-exclusion must be STRUCTURAL (a file the tool cannot
// meaningfully analyse) and carry a one-line reason. Never convert this into a
// hand-maintained include-list of files to cover.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  // `related: false` — run the FULL vitest suite against every mutant. Vitest's
  // default "related" mode only runs tests whose module graph imports the
  // mutant; 30+ of the unit suites load their core via
  // `createRequire().require()` (CommonJS, untracked by Vitest's graph), so
  // related-mode would silently skip them and report those cores as uncovered.
  // Full-suite runs keep the gate honest.
  vitest: { configFile: 'vitest.config.js', related: false },
  coverageAnalysis: 'off',
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  mutate: ['core/**/*-core.js'],
  // Target 100% (mirrors the grew-tv-app + homeschooling-tools gates).
  // `break: 100` means the run is RED until every mutant is killed. This is
  // ADVISORY and NON-BLOCKING in CI: it runs on `main` only (never a PR gate)
  // and Grew checks never block a merge — the red/green signal just lands on
  // main, which is why the workflow self-notifies via a `mutation-gate` issue.
  // To implementers it is a real gate: kill survivors with real tests. Never
  // lower this bar or exclude "equivalent" mutants to go green.
  //
  // It ships RED today: baseline 78.87% over 5519 mutants (3934 killed, 419
  // timed out, 925 survived, 241 no-coverage; ~11.5 min). The survivor-sweep
  // follow-up (TASK-MUTATION-SWEEP-APP) drives the 1166 unkilled mutants → 0.
  thresholds: { high: 100, low: 100, break: 100 },
};
