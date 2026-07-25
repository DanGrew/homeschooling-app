# Working norms for this repo

Shared process rules — worktrees, draft-PR / never-merge, the modes and the state machine —
are **claude-workflow**'s `docs/WAYS.md`. This file is the app-specific half.

## Output standards

| format | rule |
|---|---|
| **SVG** | no comments, no decorative whitespace, no `id`/`class` unless CSS needs them |
| **HTML** | inline styles only, no unused rules, no comments |
| **Markdown** | no preamble, no trailing summaries — content only |

Return **only** the generated output unless explanation was explicitly requested.

## ⛔ Verify the spec's premise before building

Specs go stale as the code moves on. If a spec assumes behaviour that no longer holds — it
says objects spawn stacked, but the add button now spawns at spread positions — do **not**
silently implement around it. Confirm with the owner whether the task is still relevant; they
often already know. A wrong premise costs a whole build/test/revert cycle.

## ⛔ Every bug fix ships a regression test proven to fail on the old code

Write the test, **watch it fail before the fix**, then make it pass. Don't wait to be asked.
A fix without a red-then-green test isn't done.

## ⛔ Never run the full Playwright suite without permission

`npm test` takes ~4 minutes. Run only the file for the feature under development:

```bash
npx playwright test tests/<file>.test.js
```

CI runs the full suite on every PR, so a local full run buys nothing most of the time.

## Tooling

⚠️ **`gh pr create` is blocked in the agent sandbox** — PR creation is always done from the
main session after any parallel agents have finished.
