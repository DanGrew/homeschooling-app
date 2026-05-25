import { saveEvent } from './learning-db.js';
import { showLearningMoment } from '../../components/learning-moments/learning-moment-service.js';

var DEFAULT_MOMENT = 'Learning Moment! - Well Done!';

export function recordLearningEvent(event, moment, activity) {
  try {
    saveEvent(Object.assign({ id: crypto.randomUUID() }, event));
  } catch(e) {}
  showLearningMoment(moment || DEFAULT_MOMENT, activity);
}
