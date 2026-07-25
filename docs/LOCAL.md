# Running the app locally

Static site, **no build step** — files are served directly and relative links work as-is.

## First-time setup — primary checkout only

```bash
npm install
npx playwright install chromium     # the browser binary is not vendored
```

## ⛔ In a worktree, do NOT `npm install`

A worktree starts with no `node_modules`, and `test-server.js` does
`require('./node_modules/serve-handler')` **relative to the script dir** — so the worktree
itself must have one. Symlink the primary checkout's instead; it is instant and avoids a
permission prompt:

```bash
ln -sfn /abs/path/to/homeschooling-app/node_modules /abs/path/to/<worktree>/node_modules
```

`.gitignore` ignores `node_modules` (no trailing slash) so the symlink is **not** committed.
⛔ Never `rm` it to "clean" before a commit — `git add -A` is already safe, and deleting it is
what breaks `node test-server.js` with `Cannot find module './node_modules/serve-handler'`.

## Serve the worktree you are working in

⛔ **Always use the no-`cd` form** — pass `test-server.js` by absolute path. A `cd` in a
compound command triggers a permission prompt.

```bash
PORT=3001 node /abs/path/to/<worktree>/test-server.js     # → http://localhost:3001/
```

`test-server.js` serves **its own directory** (`public: __dirname`) and `chdir`s to it on
startup, so the directory served is wherever the *script file* lives — pointing `node` at the
worktree's copy serves that worktree regardless of your shell's cwd, and it still works if the
shell's launch directory has since been deleted. It strips the `/homeschooling-app`
GitHub-Pages path prefix, so both `http://localhost:3001/` and
`http://localhost:3001/homeschooling-app/...` resolve — the latter matches the deployed URL.
Open `/` and it redirects to `app/`.

## ⛔ One port per worktree — never reuse a server across worktrees

Each worktree serves only its own files, so a server on `:3000` from another tree (or
IntelliJ's autostart) will show you the **wrong worktree's code**. Pick a distinct `PORT` per
worktree and hand the user that exact URL when they need to see your branch — they cannot
`git checkout` your worktree from the shared checkout, so a running server pointed at it is how
they see the change.

Same rule for Playwright: it reads `PORT` / a `.port` file (default 3000) and will
`reuseExistingServer` locally, so set a per-worktree `PORT` or a test run can silently hit
another tree's server. Playwright auto-starts its own web server (`webServer` in
`playwright.config.js`) — you do **not** need to start one to run tests.

## Servers are on-demand, and stopped when done

Not always-on. A worktree is just files; nothing serves it until someone starts a server. When
a change needs the user to eyeball it, the hand-off **must** give the copy-paste start command,
the URL, and a reminder to stop it.

```bash
# start — absolute path, no cd:
PORT=3007 node <worktree-path>/test-server.js     # → http://localhost:3007/app/...
# stop when done:  Ctrl-C   (or, if backgrounded:)  lsof -ti:3007 | xargs kill
```

⛔ Don't start one speculatively, and tear down any server you started before ending the
session unless the user still has it open.
