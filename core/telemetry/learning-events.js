import { saveEvent } from './learning-db.js';
import { showLearningMoment } from '../../components/learning-moments/learning-moment-service.js';

export function recordLearningEvent(event, moment) {
  try {
    saveEvent(Object.assign({ id: crypto.randomUUID() }, event));
  } catch(e) {}
  if (moment) { showLearningMoment(moment); }
}
