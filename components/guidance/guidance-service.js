import { queue, interrupt, stop } from '../speech/speech-ui.js';
import { GuidanceOverlay } from './guidance-overlay.js';
import { recordLearningEvent } from '../../core/telemetry/learning-events.js';

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
    var text = _resolveText(step.text);
    svc._overlay.show(
      svc._guideSrc(),
      { text: text, auto: step.auto, success: step.success },
      svc._stepIdx + 1, svc._lesson.steps.length,
      function() { svc._advance(); },
      function() { interrupt(text); },
      function() { svc.stop(); }
    );
    interrupt(text);
  }
};

var TERMINAL_CHECK = {
  'true':  function()   { return true; },
  'false': function(ns) { return !ns.expect; }
};

var PRAISE_APPEND = {
  'true':  function(text) { return text + '\n' + TERMINAL_PRAISE[Math.floor(Math.random() * TERMINAL_PRAISE.length)]; },
  'false': function(text) { return text; }
};

var SILENT_CHECK = {
  'true':  function()   { return false; },
  'false': function(ns) { return !ns.text; }
};

var SILENT_ADVANCE = {
  'true':  function(svc) { svc._stepIdx++; },
  'false': function()    {}
};

var NEXT_CB = {
  'true':  function()    { return null; },
  'false': function(svc) { return function() { svc._advance(); }; }
};

export function GuidanceService() {
  this._overlay = new GuidanceOverlay();
  this._lesson = null;
  this._stepIdx = 0;
  var self = this;
  window.addEventListener('guidance:event', function(e) { self._handle(e.detail.type); });
}

GuidanceService.prototype.start = function(lesson) {
  var self = this;
  [this._lesson].filter(Boolean).forEach(function() { self.stop(); });
  this._lesson = lesson;
  this._stepIdx = 0;
  window.dispatchEvent(new CustomEvent('guidance:start'));
  this._showStep();
};

GuidanceService.prototype.stop = function() {
  this._lesson = null;
  this._overlay.hide();
  stop();
  window.dispatchEvent(new CustomEvent('guidance:stop'));
};

GuidanceService.prototype.complete = function() {
  var lessonId = this._lesson && this._lesson.id;
  var activityId = window.ADULT_PROMPTS_ACTIVITY || null;
  this.stop();
  try {
    recordLearningEvent({
      version: 1,
      type: 'lesson_completed',
      timestamp: Date.now(),
      lessonId: lessonId,
      activityId: activityId
    });
  } catch(e) {}
};

GuidanceService.prototype._handle = function(type) {
  var self = this;
  [this._lesson].filter(Boolean).forEach(function() { stop(); });
  [this._lesson].filter(Boolean)
    .map(function(l) { return l.steps[self._stepIdx]; })
    .filter(Boolean)
    .filter(function(step) { return step.expect === type; })
    .forEach(function(step) { STEP_REACTION[String(!!step.feedback)](self, step); });
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

GuidanceService.prototype._showStep = function() {
  var step = this._lesson.steps[this._stepIdx];
  SHOW_STEP[String(!step.text)](this, step);
};

GuidanceService.prototype._showFeedback = function(rawText) {
  var self = this;
  var text = _resolveText(rawText);
  var displayIdx = this._stepIdx + 1;
  var nextStep = this._lesson.steps[this._stepIdx + 1];
  var isTerminal = TERMINAL_CHECK[String(!nextStep)](nextStep);
  text = PRAISE_APPEND[String(isTerminal)](text);
  var nextSilent = SILENT_CHECK[String(isTerminal)](nextStep);
  SILENT_ADVANCE[String(nextSilent)](this);
  this._overlay.show(
    this._guideSrc(),
    { text: text, auto: !nextSilent, success: isTerminal },
    displayIdx, this._lesson.steps.length,
    NEXT_CB[String(nextSilent)](self),
    function() { interrupt(text); },
    function() { self.stop(); }
  );
  setTimeout(function() { interrupt(text); }, 0);
};
