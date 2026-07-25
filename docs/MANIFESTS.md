# Content manifests

```bash
node scripts/generate-manifests.js
```

Regenerates the generated manifests from the content files — `content/learnings/manifest.json`
and `content/dictionary/manifests/`. **Run it and commit the result** after adding, removing or
renaming any learning or dictionary entry.

⚠️ The old `content/lessons/` format and its `index.json` were retired; every activity now uses
`content/learnings/`.

## ⛔ The gotcha: `check-manifests` does not check everything

The CI gate only diffs `content/dictionary/manifests/`. It does **not** verify
`content/learnings/manifest.json`, which can therefore drift silently — stale entries pointing
at deleted content.

That manifest still feeds the `check-manifest-files` gate (every entry must point at a file
that exists), so a deletion *will* eventually be caught — but only as a broken reference, not
as drift. Regenerate after every content change rather than relying on it.

**What no longer depends on it:** the Curriculum Coverage page (`app/curriculum/`) and
`tests/curriculum.test.js` build from the learning catalogue (`content/learning-catalogue/`),
so manifest drift no longer breaks them.
