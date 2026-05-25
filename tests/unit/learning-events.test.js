import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../core/telemetry/learning-db.js', () => ({
  saveEvent: vi.fn()
}));

vi.mock('../../components/learning-moments/learning-moment-service.js', () => ({
  showLearningMoment: vi.fn()
}));

import { saveEvent } from '../../core/telemetry/learning-db.js';
import { showLearningMoment } from '../../components/learning-moments/learning-moment-service.js';
import { recordLearningEvent } from '../../core/telemetry/learning-events.js';

beforeEach(() => { vi.clearAllMocks(); });

describe('recordLearningEvent', () => {
  it('calls saveEvent with the provided event fields', () => {
    recordLearningEvent({ version: 1, type: 'lesson_completed', timestamp: 123, lessonId: 'make_orange' });
    expect(saveEvent).toHaveBeenCalledOnce();
    const saved = saveEvent.mock.calls[0][0];
    expect(saved.type).toBe('lesson_completed');
    expect(saved.lessonId).toBe('make_orange');
    expect(saved.version).toBe(1);
  });

  it('adds an id field', () => {
    recordLearningEvent({ version: 1, type: 'lesson_completed', timestamp: 123 });
    const saved = saveEvent.mock.calls[0][0];
    expect(typeof saved.id).toBe('string');
    expect(saved.id.length).toBeGreaterThan(0);
  });

  it('does not throw when saveEvent throws', () => {
    saveEvent.mockImplementation(() => { throw new Error('db error'); });
    expect(() => recordLearningEvent({ version: 1, type: 'test', timestamp: 0 })).not.toThrow();
  });

  it('calls showLearningMoment when moment provided', () => {
    recordLearningEvent({ version: 1, type: 'test', timestamp: 0 }, 'You made orange!');
    expect(showLearningMoment).toHaveBeenCalledWith('You made orange!', undefined);
  });

  it('calls showLearningMoment with default when moment absent', () => {
    recordLearningEvent({ version: 1, type: 'test', timestamp: 0 });
    expect(showLearningMoment).toHaveBeenCalledWith('Learning Moment! - Well Done!', undefined);
  });

  it('passes activity name to showLearningMoment', () => {
    recordLearningEvent({ version: 1, type: 'test', timestamp: 0 }, null, 'AND Gate');
    expect(showLearningMoment).toHaveBeenCalledWith('Learning Moment! - Well Done!', 'AND Gate');
  });

  it('records event even when moment provided', () => {
    recordLearningEvent({ version: 1, type: 'test', timestamp: 0 }, 'You solved it!');
    expect(saveEvent).toHaveBeenCalledOnce();
  });
});
