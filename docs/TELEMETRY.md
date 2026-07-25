# Telemetry — the `learning_completed` event

Every activity records **one** `learning_completed` event at session end, using
`recordLearningEvent` from `core/telemetry/learning-events.js`. Reference implementation:
`ui/colouring-playground/colouring-playground-ui.js`.

```js
import { recordLearningEvent } from '../../core/telemetry/learning-events.js';

var eventFired = false;

function onActivityComplete() {
  if (eventFired) return;
  eventFired = true;
  recordLearningEvent({
    version: 1,
    type: 'learning_completed',
    timestamp: Date.now(),
    learning_id: 'activity-id',   // stable string identifying the activity/mode
    variant_id: variantId,        // e.g. content pack, puzzle id, catalog — omit if no variant
    activity_id: 'activity-id'    // same as learning_id unless activity has sub-modes
  });
}

function onReset() {
  eventFired = false;  // allow re-fire after reset/play-again
}
```

## Rules

- **One event per completed session** — guard it with the `eventFired` flag.
- **Reset the flag on play-again / reset**, or a replay records nothing.
- ⛔ **No intermediate events** — no taps, no matches, no progress. Completion only.
- Events are stored in **IndexedDB**.
