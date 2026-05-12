import { queue, interrupt, stop } from '../speech/speech-ui.js';
import { GuidanceOverlay } from './guidance-overlay.js';

function _resolveText(text) {
  var arr = [].concat(text);
  var str = arr[Math.floor(Math.random() * arr.length)];
  var vars = Object.assign({}, window.LESSON_VARS);
  Object.keys(vars).forEach(function(k) { str = str.split('{' + k + '}').join(vars[k]); });
  return str;
}

var STEP_REACTION = {
  'true':  function(svc, step) { svc._showFeedback(step.feedback); },
  'false': function(svc)       { svc._advance(); }
};

var ADVANCE_ACTION = {
  'true':  function(svc) { svc.stop(); },
  'false': function(svc) { svc._showStep(); }
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
  var text = _resolveText(step.text);
  var total = this._lesson.steps.length;
  this._overlay.show(
    this._guideSrc(),
    { text: text, auto: step.auto, success: step.success },
    this._stepIdx + 1, total,
    function() { self._advance(); },
    function() { interrupt(text); },
    function() { self.stop(); }
  );
  interrupt(text);
};

GuidanceService.prototype._showFeedback = function(rawText) {
  var self = this;
  var text = _resolveText(rawText);
  var total = this._lesson.steps.length;
  this._overlay.show(
    this._guideSrc(),
    { text: text, auto: true },
    this._stepIdx + 1, total,
    function() { self._advance(); },
    function() { interrupt(text); },
    function() { self.stop(); }
  );
  queue(text);
};
