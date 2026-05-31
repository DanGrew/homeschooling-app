import { queue, interrupt, stop } from '../speech/speech-ui.js';
import { GuidanceOverlay } from './guidance-overlay.js';
import { recordLearningEvent } from '../../core/telemetry/learning-events.js';
import { initPools } from '../../core/guidance/lesson-pool.js';

function _resolveText(text) {
  var arr = [].concat(text);
  var str = arr[Math.floor(Math.random() * arr.length)];
  var vars = Object.assign({}, window.LESSON_VARS);
  Object.keys(vars).forEach(function(k) { str = str.split('{' + k + '}').join(vars[k]); });
  return str;
}

var TERMINAL_PRAISE = ['Well done!', 'Amazing!', 'Brilliant!', 'Superstar!', 'You did it!'];

var STEP_REACTION = {
  'true':  function(svc, step) { svc._showFeedback(step.feedback); },
  'false': function(svc)       { svc._advance(); }
};

var ADVANCE_ACTION = {
  'true':  function(svc) { svc.complete(); },
  'false': function(svc) { svc._showStep(); }
};

var SHOW_STEP = {
  'true':  function() {},
  'false': function(svc, step) {
    var text = _resolveText(step.prompt);
    svc._overlay.show(
      svc._guideSrc(),
      { text: text, dots: Array.isArray(step.expect) ? step.expect.length : 0, failDots: step.maxFailures || 0, badge: step.badge },
      svc._stepIdx + 1, svc._lesson.steps.length,
      function() { svc._advance(); },
      function() { interrupt(text); },
      function() { svc.stop(); }
    );
    interrupt(text);
  }
};


var FAILURE_ACTION = {
  'true':  function(svc, step) { svc._showFailure(step.failureFeedback || 'Not quite — try again!'); },
  'false': function() {}
};

export function GuidanceService() {
  this._overlay = new GuidanceOverlay();
  this._lesson = null;
  this._stepIdx = 0;
  this._startReq = 0;
  this._collected = [];
  this._failureCount = 0;
  var self = this;
  window.addEventListener('guidance:event', function(e) { self._handle(e.detail.type); });
}

GuidanceService.prototype.start = function(lesson) {
  var self = this;
  [this._lesson].filter(Boolean).forEach(function() { self.stop(); });
  var req = ++this._startReq;
  fetch(window.LEARNINGS_BASE + lesson.id + '.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      [1].filter(function() { return req === self._startReq; }).forEach(function() {
        initPools(data);
        self._lesson = data;
        self._stepIdx = 0;
        window.dispatchEvent(new CustomEvent('guidance:start', { detail: { lesson: data } }));
        (data.pageControls || []).forEach(function(ctrl) {
          window.dispatchEvent(new CustomEvent('page:control', { detail: { type: ctrl } }));
        });
        self._showStep();
      });
    });
};

GuidanceService.prototype.stop = function() {
  this._lesson = null;
  this._overlay.hide();
  stop();
  window.dispatchEvent(new CustomEvent('guidance:stop'));
  window.dispatchEvent(new CustomEvent('page:control', { detail: { type: 'PAGE_CONTROL_RESET' } }));
};

GuidanceService.prototype.complete = function() {
  var learningId = this._lesson && this._lesson.id;
  var activityId = window.ACTIVITY_ID || null;
  var activityTitle = this._lesson && this._lesson.title;
  this.stop();
  try {
    recordLearningEvent({
      version: 1,
      type: 'learning_completed',
      timestamp: Date.now(),
      learning_id: learningId,
      activity_id: activityId
    }, null, activityTitle);
  } catch(e) {}
};

GuidanceService.prototype._handle = function(type) {
  var self = this;
  if (!this._lesson) return;
  var step = this._lesson.steps[this._stepIdx];
  if (!step) return;
  if (Array.isArray(step.expect)) {
    if (step.expect.indexOf(type) !== -1 && self._collected.indexOf(type) === -1) {
      self._collected.push(type);
      self._overlay.setDots(self._collected.length, step.expect.length);
      if (self._collected.length === step.expect.length) {
        STEP_REACTION[String(!!step.feedback)](self, step);
      }
    } else if (step.expect.indexOf(type) === -1 && step.maxFailures) {
      self._failureCount++;
      self._overlay.setFailureDots(self._failureCount, step.maxFailures);
      FAILURE_ACTION[String(self._failureCount >= step.maxFailures)](self, step);
    }
  } else {
    [step].filter(function(s) { return s.expect === type; })
      .forEach(function(s) { STEP_REACTION[String(!!s.feedback)](self, s); });
  }
};

GuidanceService.prototype._advance = function() {
  var self = this;
  [this._lesson].filter(Boolean).forEach(function(l) {
    self._stepIdx++;
    ADVANCE_ACTION[String(self._stepIdx >= l.steps.length)](self);
  });
};

GuidanceService.prototype._guideSrc = function() {
  return window.DICT_BASE + this._lesson.guide + '/' + this._lesson.guide + '.svg';
};

GuidanceService.prototype._showFailure = function(text) {
  var self = this;
  var resolved = _resolveText(text);
  this._overlay.showFailure(this._guideSrc(), resolved, function() { self.stop(); });
  setTimeout(function() { interrupt(resolved); }, 0);
};

GuidanceService.prototype._showStep = function() {
  var self = this;
  this._collected = [];
  this._failureCount = 0;
  var step = this._lesson.steps[this._stepIdx];
  (step.pageControls || []).forEach(function(ctrl) {
    window.dispatchEvent(new CustomEvent('page:control', { detail: { type: ctrl } }));
  });
  if (step.auto) {
    var text = _resolveText(step.text);
    this._overlay.show(
      this._guideSrc(),
      { text: text, auto: true },
      this._stepIdx + 1, this._lesson.steps.length,
      function() { self._advance(); },
      function() { interrupt(text); },
      function() { self.stop(); }
    );
    interrupt(text);
    return;
  }
  SHOW_STEP[String(!step.prompt)](this, step);
};

GuidanceService.prototype._showFeedback = function(rawText) {
  var self = this;
  var feedbackText = _resolveText(rawText);
  var nextStep = this._lesson.steps[this._stepIdx + 1];
  var displayIdx, text;

  if (!nextStep) {
    displayIdx = this._stepIdx + 1;
    text = feedbackText + '\n' + TERMINAL_PRAISE[Math.floor(Math.random() * TERMINAL_PRAISE.length)];
    this._overlay.show(
      this._guideSrc(),
      { text: text, auto: true, success: true },
      displayIdx, this._lesson.steps.length,
      function() { self._advance(); },
      function() { interrupt(text); },
      function() { self.stop(); }
    );
    setTimeout(function() { interrupt(text); }, 0);
  } else {
    this._stepIdx++;
    this._collected = [];
    this._failureCount = 0;
    (nextStep.pageControls || []).forEach(function(ctrl) {
      window.dispatchEvent(new CustomEvent('page:control', { detail: { type: ctrl } }));
    });
    displayIdx = this._stepIdx + 1;
    text = nextStep.prompt
      ? feedbackText + '\n' + _resolveText(nextStep.prompt)
      : feedbackText;
    this._overlay.show(
      this._guideSrc(),
      { text: text, dots: Array.isArray(nextStep.expect) ? nextStep.expect.length : 0, failDots: nextStep.maxFailures || 0, badge: nextStep.badge },
      displayIdx, this._lesson.steps.length,
      null,
      function() { interrupt(text); },
      function() { self.stop(); }
    );
    interrupt(text);
  }
};
