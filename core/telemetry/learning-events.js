import { saveEvent } from './learning-db.js';

export function recordLearningEvent(event) {
  try {
    saveEvent(Object.assign({ id: crypto.randomUUID() }, event));
  } catch(e) {}
}
