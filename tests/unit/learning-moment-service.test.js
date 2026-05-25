// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('learning-moment-service', () => {
  var showLearningMoment, LEARNING_MOMENT_COOLDOWN_MS;
  var mockShow, mockHide;

  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = '';

    mockShow = vi.fn();
    mockHide = vi.fn();

    vi.doMock('../../components/learning-moments/learning-moment.js', () => ({
      show: mockShow,
      hide: mockHide,
      LEARNING_MOMENT_DURATION_MS: 2000
    }));

    var mod = await import('../../components/learning-moments/learning-moment-service.js');
    showLearningMoment = mod.showLearningMoment;
    LEARNING_MOMENT_COOLDOWN_MS = mod.LEARNING_MOMENT_COOLDOWN_MS;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('exports LEARNING_MOMENT_COOLDOWN_MS as 1000', () => {
    expect(LEARNING_MOMENT_COOLDOWN_MS).toBe(1000);
  });

  it('calls show with correct message', () => {
    showLearningMoment('You made orange!');
    expect(mockShow).toHaveBeenCalledWith('You made orange!');
  });

  it('calls hide after LEARNING_MOMENT_DURATION_MS', () => {
    showLearningMoment('You made orange!');
    expect(mockHide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it('second call while displayed replaces message', () => {
    showLearningMoment('First');
    showLearningMoment('Second');
    expect(mockShow).toHaveBeenCalledTimes(2);
    expect(mockShow).toHaveBeenLastCalledWith('Second');
  });

  it('second call while displayed resets dismiss timer', () => {
    showLearningMoment('First');
    vi.advanceTimersByTime(1500);
    showLearningMoment('Second');
    vi.advanceTimersByTime(1500);
    expect(mockHide).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(mockHide).toHaveBeenCalledTimes(1);
  });

  it('call within cooldown window is silently dropped', () => {
    showLearningMoment('First');
    vi.advanceTimersByTime(2000);
    vi.advanceTimersByTime(500);
    showLearningMoment('During cooldown');
    expect(mockShow).toHaveBeenCalledTimes(1);
  });

  it('call after cooldown window is accepted', () => {
    showLearningMoment('First');
    vi.advanceTimersByTime(2000);
    vi.advanceTimersByTime(1000);
    showLearningMoment('After cooldown');
    expect(mockShow).toHaveBeenCalledTimes(2);
    expect(mockShow).toHaveBeenLastCalledWith('After cooldown');
  });
});
