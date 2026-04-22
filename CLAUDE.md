# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Public-facing homeschooling app. Activities built for a child aged 3–4. This repo contains only the app shell and HTML/SVG activities — curriculum thinking and EYFS reference material lives in the private `homeschooling` repo.

**Architecture:** app is a static site served via GitHub Pages at `https://dangrew.github.io/homeschooling-app/`. No build step — files are served directly, relative links work as-is.

## Repository Structure

- `maths/` — maths activities (count shapes, match colour, match shape, connect the dots)
- `index.html` — root redirect to `maths/`

## Guidelines

Full session guidelines (output standards, token efficiency, ways of working) are maintained in the private `homeschooling` repo. If working in this repo, ask the user to paste the relevant sections from there before starting.

## Output Standards

- SVG: no comments, no decorative whitespace, no `id`/`class` unless needed for CSS
- HTML: inline styles only, no unused rules, no comments
- Markdown: no preamble, no trailing summaries — content only

Return only the generated output unless explanation is explicitly requested.

## Git and GitHub

**Branching:** Feature branches off `main`. Naming: `<topic>-<descriptor>`.
**PRs:** Always draft (`--draft`), one per logical unit. Merge target is always `main`.

## Tooling

**gh CLI:** not on PATH in bash — always use full path: `"/c/Program Files/GitHub CLI/gh.exe"`
**Parallel agents:** `gh pr create` is blocked in the agent sandbox — PR creation must always be done from the main session after agents complete.

## Token Efficiency

**Caveman** is installed globally. Use Lite mode by default for collaborative sessions. Use Full/Ultra for pure generation tasks (SVG, HTML, Markdown).

**Session discipline:**
- One session = one issue or activity
- Scope prompts to one file or one concern
- Use `/compact` before switching concerns within a long session
