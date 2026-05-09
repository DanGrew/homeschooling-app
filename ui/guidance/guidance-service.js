import { GuidanceSpeech } from './guidance-speech.js';
import { GuidanceOverlay } from './guidance-overlay.js';

export function GuidanceService() {
  this._speech = GuidanceSpeech;
  this._overlay = new GuidanceOverlay();
  this._lesson = null;
  this._stepIdx = 0;
  var self = this;
  window.addEventListener('guidance:event', function(e) { self._handle(e.detail.type); });
}

GuidanceService.prototype.start = function(lesson) {
  if (this._lesson) this.stop();
  this._lesson = lesson;
  this._stepIdx = 0;
  this._showStep(true);
};

GuidanceService.prototype.stop = function() {
  this._lesson = null;
  this._overlay.hide();
  this._speech.stop();
};

GuidanceService.prototype._handle = function(type) {
  if (!this._lesson) return;
  var step = this._lesson.steps[this._stepIdx];
  if (!step || step.expect !== type) return;
  if (step.feedback) this._showFeedback(step.feedback);
  else this._advance();
};

GuidanceService.prototype._showFeedback = function(text) {
  var self = this;
  var total = this._lesson.steps.length;
  this._overlay.show(
    this._guideSrc(),
    { text: text, auto: true },
    this._stepIdx + 1,
    total,
    function() { self._advance(); },
    function() { self._speech.speak(text, 'lesson'); },
    function() { self.stop(); }
  );
  this._speech.speak(text, 'lesson');
};

GuidanceService.prototype._advance = function() {
  if (!this._lesson) return;
  this._stepIdx++;
  if (this._stepIdx >= this._lesson.steps.length) { this.stop(); return; }
  this._showStep(true);
};

GuidanceService.prototype._guideSrc = function() {
  return (window.DICT_BASE || '../../dictionary/entries/') +
    this._lesson.guide + '/' + this._lesson.guide + '.svg';
};

GuidanceService.prototype._showStep = function(speak) {
  var self = this;
  var step = this._lesson.steps[this._stepIdx];
  var total = this._lesson.steps.length;
  this._overlay.show(
    this._guideSrc(),
    step,
    this._stepIdx + 1,
    total,
    function() { self._advance(); },
    function() { self._speech.speak(step.text, 'lesson'); },
    function() { self.stop(); }
  );
  if (speak) this._speech.speak(step.text, 'lesson');
};
