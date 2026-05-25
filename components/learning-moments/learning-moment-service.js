import { show, hide, LEARNING_MOMENT_DURATION_MS } from './learning-moment.js';

var LEARNING_MOMENT_COOLDOWN_MS = 1000;

var _active = false;
var _cooldown = false;
var _dismissTimer = null;
var _cooldownTimer = null;

function _onDismiss() {
  _active = false;
  _dismissTimer = null;
  _cooldown = true;
  _cooldownTimer = setTimeout(function() {
    _cooldown = false;
    _cooldownTimer = null;
  }, LEARNING_MOMENT_COOLDOWN_MS);
}

export function showLearningMoment(message) {
  if (_cooldown) return;

  if (_dismissTimer) {
    clearTimeout(_dismissTimer);
    _dismissTimer = null;
  }

  show(message);
  _active = true;
  _dismissTimer = setTimeout(function() {
    hide();
    _onDismiss();
  }, LEARNING_MOMENT_DURATION_MS);
}

export { LEARNING_MOMENT_COOLDOWN_MS };
