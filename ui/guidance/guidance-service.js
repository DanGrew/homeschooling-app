import { GuidanceSpeech } from './guidance-speech.js';
import { GuidanceOverlay } from './guidance-overlay.js';

var STEP_REACTION = {
  'true':  function(svc, step) { svc._showFeedback(step.feedback); },
  'false': function(svc)       { svc._advance(); }
};

var ADVANCE_ACTION = {
  'true':  function(svc) { svc.stop(); },
  'false': function(svc) { svc._showStep(); }
};

export function GuidanceService() {
  this._speech = GuidanceSpeech;
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
  this._showStep();
};

GuidanceService.prototype.stop = function() {
  this._lesson = null;
  this._overlay.hide();
  this._speech.stop();
};

GuidanceService.prototype._handle = function(type) {
  var self = this;
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
  var self = this;
  var step = this._lesson.steps[this._stepIdx];
  var total = this._lesson.steps.length;
  this._overlay.show(
    this._guideSrc(), step, this._stepIdx + 1, total,
    function() { self._advance(); },
    function() { self._speech.speak(step.text); },
    function() { self.stop(); }
  );
  this._speech.speak(step.text);
};

GuidanceService.prototype._showFeedback = function(text) {
  var self = this;
  var total = this._lesson.steps.length;
  this._overlay.show(
    this._guideSrc(), { text: text, auto: true }, this._stepIdx + 1, total,
    function() { self._advance(); },
    function() { self._speech.speak(text); },
    function() { self.stop(); }
  );
  this._speech.speak(text);
};
