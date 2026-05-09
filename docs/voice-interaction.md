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
| `ui/speech/speech-ui.js` | SpeechService: `speak()`, `stop()`, `setMode()`, `setEnabled()`, `warmUp()` |
| `ui/speech/speakable.js` | DOM helpers: `makeInteractive`, `makeSpeakable`, `makeSpeakableButton` |
| `app/shared/speakable.css` | CSS animations and class contracts — must be included by any page that uses speakable |

---

## SpeechService (`speech-ui.js`)

### API

```js
import { speak, stop, setMode, setEnabled, warmUp, cachedBestVoice } from '../speech/speech-ui.js';
```

| Function | Description |
|----------|-------------|
| `speak(text)` | Speaks text. Cancels any in-progress utterance first. No-ops on empty/null. |
| `stop()` | Cancels current speech immediately. |
| `setMode(mode)` | `'full'` (speak), `'quiet'` (suppress), `'off'` (suppress). |
| `setEnabled(bool)` | Convenience — maps `true` → `'full'`, `false` → `'off'`. |
| `warmUp()` | Speaks a silent utterance to unblock the audio context. Call on first user gesture. |
| `cachedBestVoice()` | Returns the best available `SpeechSynthesisVoice` or `null`. |

### Mode behaviour

| Mode | `speak()` |
|------|-----------|
| `'full'` | Speaks |
| `'quiet'` | Suppresses |
| `'off'` | Suppresses |

### When to call `warmUp()`

Mobile browsers require a user gesture before audio will play. Call `warmUp()` on the first `pointerdown` in each activity:

```js
document.addEventListener('pointerdown', warmUp, { once: true });
```

---

## Speakable helpers (`speakable.js`)

### `makeInteractive(el, onTap)`

Base primitive. Use when you need a tap action that is **not** speech (e.g. incrementing a counter, selecting a colour), or when you want to control speech yourself.

- Adds `.speakable` class → purple glow at rest
- Adds 100 ms debounce (protects against double-fire on touch)
- Calls `e.preventDefault()` on `pointerdown` — this kills the subsequent `click` event
- Triggers scale-bounce feedback via `.speakable--tap` class

```js
import { makeInteractive } from '../speech/speakable.js';

makeInteractive(myButton, () => {
  doSomething();
  speak('something');  // call speak AFTER the action — see ordering rule below
});
```

### `makeSpeakable(el, text)`

Wraps `makeInteractive`. Use for any element that should speak when tapped.

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
| `.speakable` | Applied by `makeInteractive` | Purple glow at rest (always on) |
| `.speakable--tap` | Applied/removed by `triggerFeedback` | Scale-bounce 180ms on tap |
| `.speakable--flash` | Apply/remove in JS for one-off highlight | Gold flash 400ms, then removes |
| `.speakable--highlight` | Apply/remove in JS for ongoing highlight | Gold glow + scale, infinite until removed |

### Override rule — critical

`.speakable` sets a `filter` animation (purple glow). `.speakable--flash` and `.speakable--highlight` also set `filter`. They win the cascade **because they are defined later in the stylesheet** — same specificity, later rule wins.

**Do not override the filter via inline style** (`el.style.filter = ...`). Inline styles have higher specificity and will break the cascade. Always use class toggles:

```js
// CORRECT
el.classList.add('speakable--flash');
setTimeout(() => el.classList.remove('speakable--flash'), 400);

// WRONG — inline style beats class-based animation
el.style.filter = 'drop-shadow(0 0 16px gold)';
```

### Flash helper pattern

```js
function flash(el) {
  el.classList.add('speakable--flash');
  el.addEventListener('animationend', function handler() {
    el.classList.remove('speakable--flash');
    el.removeEventListener('animationend', handler);
  }, { once: true });
}
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

## Ordering rule — speak AFTER action

`speak()` calls `speechSynthesis.cancel()` internally. Any code that also calls `cancel()` (e.g. `stopCounting()`) must run **before** `speak()`, not after, or it will cancel the utterance you just scheduled.

```js
// CORRECT — action first, speak second
makeInteractive(btn, () => {
  change('a', 1);   // may cancel speech internally
  speak('plus');    // schedules after cancel
});

// WRONG — speak gets cancelled
makeInteractive(btn, () => {
  speak('plus');
  change('a', 1);   // cancels the utterance above
});
```

---

## `pointerdown` vs `click` — do not mix

`makeInteractive` calls `e.preventDefault()` on `pointerdown`. This suppresses the subsequent `click` event on that element. If you attach a `click` listener to the same element, it will never fire.

All handlers must go inside the `makeInteractive` / `makeSpeakable` callback:

```js
// CORRECT
makeInteractive(el, () => doThing());

// WRONG — click is suppressed after makeInteractive
makeInteractive(el, () => {});
el.addEventListener('click', () => doThing());

// ALSO WRONG
el.onclick = () => doThing();
```

---

## Adding a new speakable element — checklist

1. Include `speakable.css` in the activity's `index.html`.
2. Import `makeSpeakable` or `makeInteractive` from `ui/speech/speakable.js`.
3. Call `document.addEventListener('pointerdown', warmUp, { once: true })` in `init()`.
4. Use `makeSpeakable(el, text)` for speak-on-tap elements.
5. Use `makeInteractive(el, cb)` when the tap does something other than (or in addition to) speaking.
6. Put `speak()` **after** any action that might cancel speech.
7. Use class toggles (`.speakable--flash`, `.speakable--highlight`) — never inline `filter` style.
8. Never attach a `click` listener to an element already passed to `makeInteractive`.

---

## Migrating an existing activity

1. Add `<link rel="stylesheet" href="../../shared/speakable.css">` to `index.html`.
2. If the script tag is not `type="module"`, change it — imports require ES modules.
3. Remove any "Say it" / "Speak" buttons — the elements themselves become speakable.
4. Replace `element.onclick = ...` with `makeInteractive(element, ...)`.
5. For images that should be speakable, create them with `makeImgEl` (or equivalent) and call `makeSpeakable(img, item.name)`.
6. Write or update Playwright tests asserting `.speakable` class on each interactive element.

---

## Tests

Playwright tests live in `tests/games/`. For each activity, assert:

- Speakable elements have the `.speakable` class
- Clicking a speakable element produces the expected visual state (outline, background, label text)
- The correct count of speakable elements exists (count precisely — wheel has 12 paths: 3 primary + 3 secondary + 6 tertiary)

Unit tests for the helpers live in `tests/unit/speech-ui.test.js` and `tests/unit/speakable.test.js`. Use `@vitest-environment jsdom` at the top of any test file that touches the DOM. Do not use `vi.resetModules()` with ESM — use static imports and reset state in `beforeEach`.
