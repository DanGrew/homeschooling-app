# Lesson & Exercise System

The guidance system drives step-by-step interactive sessions over an activity page. The page and guidance communicate via custom events on `window` — see the **Guidance + Page Control Pattern** section in `CLAUDE.md` for the event API.

---

## Conceptual model

Each lesson or exercise is a sequence of steps. A step:

1. **Prompts** — speaks a text instruction and shows the guidance overlay
2. **Expects** — waits for the child to perform one or more specific interactions on the page
3. **Gives feedback** — speaks a response and advances to the next step

Steps chain automatically: feedback auto-advances to the next step, so the child just interacts and is guided through without manual "Next" presses (unless the step is terminal).

---

## Lessons vs Exercises

| | Lesson | Exercise |
|---|---|---|
| Guidance overlay | Yes — character, text bubble, step counter | No (or minimal) |
| Text prompt per step | Yes | No — expects interaction without prompting |
| Purpose | Teach a concept through guided interaction | Apply understanding to a new situation |

Exercises state the **goal** but not the steps. The first step has a `text` prompt telling the child what to achieve ("Can you make the lamp turn on?"). Subsequent steps omit `text` — the guidance service advances silently once `expect` is satisfied. The adult guides the child on how to get there; the exercise only tells them what to aim for.

**Rule: heavy criteria go on every lesson that naturally covers them.**
`cl.topic-vocabulary` applies to any lesson that uses named elements (gates, switches, outputs). `pd.fine-motor` applies to any lesson requiring precise taps. Don't tag these only on the intro lesson — if every step in every lesson inherently covers them, every lesson's `criteria[]` array should list them. Light and medium criteria that are specific to one lesson's design stay on that lesson only.

---

**Rule: exercises must not replicate lessons.** An exercise that uses the same graph, same gate configuration, and same sequence of interactions as a lesson teaches nothing new — the child is just repeating muscle memory. Exercises should:

- Use a different puzzle configuration (different gate types, different arrangement) from any lesson covering the same concept
- Raise the complexity — linear and converging graphs over single gates
- Be open-ended where possible — "find a way to..." rather than a prescribed sequence
- Rely on adult presence to guide, not step-by-step text prompts

Single-gate exercises (AND only, OR only, etc.) almost always replicate the corresponding lesson. Avoid them unless the exercise introduces a meaningfully different challenge (e.g. "find all four combinations" rather than "turn the output on").

---

## Step schema

```json
{
  "text": "Can you turn switch A on?",
  "expect": "SWITCH_A_ON",
  "feedback": "A is on! Now turn B on too.",
  "pageControls": ["LOCK_SWITCH_B"],
  "badge": "optional badge label",
  "maxFailures": 3,
  "failureFeedback": "Not quite — try again!"
}
```

| Field | Type | Description |
|---|---|---|
| `text` | string \| string[] | Prompt spoken at step start. Array = random pick each time |
| `expect` | string \| string[] | Event type(s) required to complete step. Array = all must be collected |
| `feedback` | string \| string[] | Spoken after expect is satisfied. Array = random pick |
| `pageControls` | string[] | Page control events fired when this step loads |
| `badge` | string | Optional label shown in overlay |
| `maxFailures` | number | Wrong-interaction tolerance before step fails |
| `failureFeedback` | string \| string[] | Spoken on failure |

---

## Random text pools

Any `text` or `feedback` value can be an array of alternatives. The guidance service picks one at random on each use:

```json
{ "text": ["Can you find switch A?", "Try turning switch A on!", "Switch A — give it a tap!"] }
```

This prevents lessons from feeling scripted after repeated plays.

---

## Lesson schema

```json
{
  "id": "and_gate",
  "title": "AND Gate",
  "number": 1,
  "guide": "cat",
  "criteria": ["uw.cause-effect", "cl.technical-vocab"],
  "pageControls": ["SHOW_SINGLE_AND_GATE"],
  "steps": [ ... ]
}
```

| Field | Description |
|---|---|
| `id` | Stable identifier — used as `learning_id` in telemetry |
| `guide` | Dictionary entry key for the guide character SVG |
| `criteria` | EYFS criterion IDs covered by this lesson (see `content/curriculum/criteria.json`) |
| `pageControls` | Fired once on lesson start — use to set up the initial page state |
| `steps` | Sequential steps |

---

## Page control

Guidance fires `page:control` events to instruct the page to change layout or state. Two sources:

- `lesson.pageControls[]` — fires once when lesson starts
- `step.pageControls[]` — fires each time a step loads
- `PAGE_CONTROL_RESET` — always fires on lesson stop (restore full page state)

The page registers a handler map:

```js
var PAGE_CTRL = {
  'SHOW_SINGLE_AND_GATE': function() { /* configure page for this lesson */ },
  'LOCK_SWITCH_B':        function() { /* disable switch B */ },
  'PAGE_CONTROL_RESET':   function() { /* restore everything */ }
};
window.addEventListener('page:control', function(e) {
  if (e.detail.type in PAGE_CTRL) PAGE_CTRL[e.detail.type]();
});
```

**Rule:** never modify `guidance-service.js` for page-specific behaviour. All page logic goes in the page's `PAGE_CTRL` map. New controls are just new string keys.

### What page controls can do

- Show or hide graph types (single gate, linear, converging)
- Lock specific switches or gates (disable interaction)
- Pre-set switch states before a step
- Focus attention on one element by hiding others

This lets lessons prompt for a specific interaction and guarantee the page is in the right state for that interaction.

### Protecting step validity

A child can interact with the page at any time — including between steps, or while feedback is showing. This can invalidate a lesson step before it loads.

**Rule: use `pageControls` on each step to enforce the preconditions that step assumes.**

For example, if step 2 assumes switch A is on (because step 1 asked the child to turn it on), and the child turns it off during step 1's feedback, step 2's expect of `SWITCH_A_OFF` will fire immediately on load. To prevent this:

- On step 2, fire a `pageControl` that disables switch A (or pre-sets it to on and locks it)
- Only unlock it when the lesson requires the child to change it

General checklist when authoring steps:

1. **Identify what state the page must be in when this step loads** — which elements should be on/off, locked, hidden
2. **Fire `pageControls` to enforce that state** — don't assume prior steps left the page in the right condition
3. **Lock everything the child isn't supposed to touch** — only expose the element(s) the current step is about
4. **Unlock via the next step's `pageControls`**, not the current step's feedback — feedback shows while the next step loads

The more complex the graph, the more important this is. Single-gate lessons may only need one switch locked; converging lessons may need most switches locked until the relevant step.

`PAGE_CONTROL_RESET` must restore full interactivity — all locks off, all elements visible.

---

## Lesson file location

Lesson JSON lives in `content/lessons/<activity>.json`. Exercises are indexed in `content/exercises/index.json` and their JSON files live alongside lesson files or in a dedicated path depending on the activity.

Each lesson file has the shape:

```json
{
  "activity": "<activity-id>",
  "lessons": [ ... ]
}
```

Exercise files follow the same step schema but steps omit `text`.
