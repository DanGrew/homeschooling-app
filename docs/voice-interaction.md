# Voice Interaction System

This document is written for the next implementer. It explains the architecture, the CSS contracts, the rules to follow, and the common mistakes to avoid. Read it before touching any speakable element.

---

## Overview

Every interactive element in this app must be speakable. Tapping any UI element either speaks text aloud or triggers an action, and gives visual feedback: a purple glow at rest, a scale-bounce on tap, and a gold flash or highlight for programmatic feedback.

The system has two layers:

1. **`ui/speech/speech-ui.js`** — controls the speech engine (mode, voice, speak/stop)
2. **`ui/speech/speakable.js`** — applies interactivity and the CSS contract to DOM elements

---

## Files

| File | Purpose |
|------|---------|
| `ui/speech/speech-ui.js` | SpeechService: `speak()`, `speakInterrupt()`, `stop()`, `setMode()`, `setEnabled()`, `warmUp()` |
| `ui/speech/speakable.js` | DOM helpers: `makeInteractive`, `makeSpeakable`, `makeSpeakableButton` |
| `app/shared/speakable.css` | CSS animations and class contracts — must be included by any page that uses speakable |

---

## SpeechService (`speech-ui.js`)

### API

```js
import { speak, speakInterrupt, stop, setMode, setEnabled, warmUp } from '../speech/speech-ui.js';
```

| Function | Description |
|----------|-------------|
| `speak(text)` | Queues text. Does not cancel in-progress speech. No-ops on empty/null. |
| `speakInterrupt(text)` | Cancels current speech then speaks. Use for user-initiated taps. |
| `stop()` | Cancels current speech immediately. |
| `setMode(mode)` | `'full'` (speak), `'quiet'` (suppress), `'off'` (suppress). Persisted to `localStorage`. |
| `setEnabled(bool)` | Convenience — maps `true` → `'full'`, `false` → `'off'`. |
| `warmUp()` | Speaks a silent utterance to unblock the audio context on mobile. |

### Mode behaviour

| Mode | Effect |
|------|--------|
| `'full'` | Speaks |
| `'quiet'` | Suppresses |
| `'off'` | Suppresses |

Mode is read from `localStorage` on load and persisted on change. Default is `'full'`.

### When to call `warmUp()`

Mobile browsers require a user gesture before audio will play. Call `warmUp()` on the first `pointerdown` in each activity:

```js
document.addEventListener('pointerdown', warmUp, { once: true });
```

### `speak` vs `speakInterrupt`

Use `speakInterrupt` for all user-tap handlers — it cancels any in-progress utterance so the tapped word always plays immediately. Use `speak` only when you are deliberately queuing (e.g. a counting sequence where each number follows the last).

---

## Speakable helpers (`speakable.js`)

### `makeInteractive(el, onTap)`

Base primitive. Use when you need a tap action that is **not** speech (e.g. incrementing a counter, selecting a colour), or when you want to control speech yourself.

- Adds `.speakable` class → purple glow at rest (HTML elements)
- SVG elements: injects a `<filter id="speakable-glow">` into the parent SVG and sets `filter="url(#speakable-glow)"` on the element instead of the CSS class
- Adds 100 ms debounce (protects against double-fire on touch)
- Listens on `click` — compatible with both mouse and touch
- Triggers scale-bounce feedback via `.speakable--tap` class

```js
import { makeInteractive } from '../speech/speakable.js';

makeInteractive(myButton, () => {
  doSomething();
  speakInterrupt('something');  // call speak AFTER the action — see ordering rule below
});
```

### `makeSpeakable(el, text)`

Wraps `makeInteractive`. Use for any element that should speak when tapped. Internally calls `speakInterrupt`.

`text` can be:
- A **string** — evaluated once at bind time
- A **function** `() => string` — evaluated on every tap (use for dynamic labels)

```js
import { makeSpeakable } from '../speech/speakable.js';

// Static label
makeSpeakable(el, 'Red');

// Dynamic label — evaluated at tap time
makeSpeakable(el, () => currentColour.label);
```

### `makeSpeakableButton(text)`

Creates a `<button>` element with `makeSpeakable` already applied. Convenience for simple speak-only buttons.

```js
import { makeSpeakableButton } from '../speech/speakable.js';

const btn = makeSpeakableButton('Hello');
container.appendChild(btn);
```

---

## CSS Contract

Include `speakable.css` in any activity page that uses speakable elements:

```html
<link rel="stylesheet" href="../../shared/speakable.css">
```

### Classes

| Class | When applied | Effect |
|-------|-------------|--------|
| `.speakable` | Applied by `makeInteractive` (HTML elements only) | Purple glow at rest |
| `.speakable--tap` | Applied/removed by `triggerFeedback` on tap | Scale-bounce 180ms |
| `.speakable--flash` | Apply/remove in JS for one-off highlight | Gold flash 400ms |
| `.speakable--highlight` | Apply/remove in JS for ongoing highlight | Gold glow + scale, infinite until removed |
| `.speakable--pulse` | Apply in JS for attention-drawing pulse | Purple pulse animation, infinite |

### SVG elements

SVG elements cannot use CSS `filter: drop-shadow` reliably across browsers. `makeInteractive` detects SVG elements automatically and instead injects a `<filter>` into the parent `<svg>` and sets the `filter` attribute on the element:

```js
// This works for both HTML and SVG — makeInteractive handles the difference
makeSpeakable(svgPath, 'Red');
```

Do not manually apply `.speakable` to SVG elements — let `makeInteractive` do it.

### Override rule — critical

`.speakable` sets a CSS `filter` (purple glow). `.speakable--flash` and `.speakable--highlight` also set `filter`. They win the cascade **because they are defined later in the stylesheet** — same specificity, later rule wins.

**Do not override the filter via inline style** (`el.style.filter = ...`). Inline styles have higher specificity and will break the cascade. Always use class toggles:

```js
// CORRECT
el.classList.add('speakable--flash');
el.addEventListener('animationend', () => el.classList.remove('speakable--flash'), { once: true });

// WRONG — inline style beats class-based animation
el.style.filter = 'drop-shadow(0 0 16px gold)';
```

### Highlight (count/sequence) pattern

```js
// Highlight one element in a sequence
function highlight(idx, imgs) {
  imgs.forEach(img => img.classList.remove('speakable--highlight'));
  Array.from(imgs).slice(idx, idx + 1)
    .forEach(img => img.classList.add('speakable--highlight'));
}

// Clear all on sequence end
function clearHighlight(imgs) {
  imgs.forEach(img => img.classList.remove('speakable--highlight'));
}
```

---

## `window.__speak` — activity title integration

`menu.js` auto-injects an `activity-title` element into `.game-area` when the nav-bar has `data-title`. It speaks the title text via `window.__speak`. This is a bridge because `menu.js` is a plain script that cannot import ES modules.

**Every activity that uses `speakable.css` must wire this:**

```js
import { speakInterrupt } from '../speech/speech-ui.js';
window.__speak = speakInterrupt;
```

Do this at the top of the module script, before any other setup. If omitted, the title has the purple glow but tapping it does nothing.

---

## Ordering rule — speak AFTER action

`speakInterrupt()` calls `speechSynthesis.cancel()` internally. Any other code that also calls `cancel()` (e.g. `stopCounting()`) must run **before** `speakInterrupt()`, not after.

```js
// CORRECT — action first, speak second
makeInteractive(btn, () => {
  change('a', 1);          // may cancel speech internally
  speakInterrupt('plus');  // schedules after cancel
});

// WRONG — speak gets cancelled
makeInteractive(btn, () => {
  speakInterrupt('plus');
  change('a', 1);          // cancels the utterance above
});
```

---

## Adding a new speakable element — checklist

1. Include `speakable.css` in the activity's `index.html`.
2. The script tag must be `type="module"` — imports require ES modules.
3. Import `speakInterrupt` and set `window.__speak = speakInterrupt` at the top of the module.
4. Call `document.addEventListener('pointerdown', warmUp, { once: true })`.
5. Use `makeSpeakable(el, text)` for speak-on-tap elements.
6. Use `makeInteractive(el, cb)` when the tap does something other than (or in addition to) speaking.
7. Put `speakInterrupt()` **after** any action that might cancel speech.
8. Use class toggles (`.speakable--flash`, `.speakable--highlight`) — never inline `filter` style.
9. Do not manually apply `.speakable` to SVG elements.

---

## Migrating an existing activity

1. Add `<link rel="stylesheet" href="../../shared/speakable.css">` to `index.html`.
2. Ensure the script tag is `type="module"`.
3. Import `speakInterrupt`, `warmUp`, `makeSpeakable`, `makeInteractive` from their modules.
4. Set `window.__speak = speakInterrupt` and register `warmUp` on `pointerdown`.
5. Remove any "Say it" / "Speak" buttons — the elements themselves become speakable.
6. Replace `element.onclick = fn` with `makeInteractive(element, fn)`.
7. Replace `speakWord(x)` calls inside onclick with `makeSpeakable(element, x)`.
8. Remove `onclick="globalFn()"` HTML attributes and `window.globalFn = fn` globals — wire via `makeInteractive` in the module instead.
9. For images that should be speakable, call `makeSpeakable(img, item.name)` after creating the element.
10. Add Playwright tests asserting `.speakable` class on each interactive element.

---

## Tests

Playwright tests live in `tests/games/`. For each activity, assert:

- Speakable elements have the `.speakable` class (or SVG `filter` attribute for SVG paths)
- Clicking a speakable element produces the expected visual or label state
- The exact count of speakable elements matches what the activity renders (be precise — colour wheel has 12 paths: 3 primary + 3 secondary + 6 tertiary)

Unit tests for the helpers live in `tests/unit/speech-ui.test.js` and `tests/unit/speakable.test.js`. Use `@vitest-environment jsdom` at the top of any test file that touches the DOM. Do not use `vi.resetModules()` with ESM — use static imports and reset state in `beforeEach`.
