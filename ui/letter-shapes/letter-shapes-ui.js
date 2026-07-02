import { makeSpeakable } from '../../components/speech/speakable.js';
import { recordLearningEvent } from '../../core/telemetry/learning-events.js';
import {
  buildLetterShapeMap, isOrderComplete, isCorrectPlacement,
  identifyPanelHtml, matchPanelHtml, orderPanelHtml
} from '../../core/letter-shapes/letter-shapes-core.js';

var REGISTRY = new URL('../../content/phonics/graphemes.json', import.meta.url).href;

function toJson(r) { return r.json(); }

export function initLetterShapes() {
  var panel = document.getElementById('ls-panel');
  var state = { cur: 'a', mode: 'identify', matchShape: 'circle', placed: [], eventFired: false };
  var shapeMap = {};

  var PANELS = {
    identify: function() { return identifyPanelHtml(shapeMap, state.cur); },
    match:    function() { return matchPanelHtml(shapeMap, state.matchShape); },
    order:    function() { return orderPanelHtml(shapeMap, state.cur, state.placed); }
  };

  function strokesOf() { return [shapeMap[state.cur], []].find(Boolean); }

  function noop() {}

  function doFire() {
    state.eventFired = true;
    recordLearningEvent({
      version: 1,
      type: 'learning_completed',
      timestamp: Date.now(),
      learning_id: 'letter-shapes',
      variant_id: state.cur,
      activity_id: window.ACTIVITY_ID
    }, null, 'Letter Shapes');
  }

  var FIRE = { 'true': doFire, 'false': noop };
  function fireComplete() { FIRE[String(!state.eventFired)](); }
  var ON_COMPLETE = { 'true': fireComplete, 'false': noop };

  function refreshCount() {
    panel.querySelectorAll('.count').forEach(function(c) {
      c.textContent = panel.querySelectorAll(c.getAttribute('data-sel')).length + '/' + c.getAttribute('data-total');
    });
  }

  function pickLetter(l) { state.cur = l; state.placed = []; state.eventFired = false; render(); }
  function pickShape(s) { state.matchShape = s; render(); }

  function placeCorrect(tile, shape) {
    state.placed.push(shape);
    render();
    ON_COMPLETE[String(isOrderComplete(strokesOf(), state.placed))]();
  }
  function placeWrong(tile) { tile.classList.add('wrong'); }
  var PLACE = { 'true': placeCorrect, 'false': placeWrong };

  function cellFound(btn) { btn.classList.toggle('found'); refreshCount(); }
  function cellWrong(btn) { btn.classList.add('wrong'); }
  var CELL = { 'true': cellFound, 'false': cellWrong };

  function bindLetter(btn) {
    makeSpeakable(btn, btn.getAttribute('data-letter'));
    btn.onclick = function() { pickLetter(btn.getAttribute('data-letter')); };
  }
  function bindShape(btn) {
    makeSpeakable(btn, btn.getAttribute('data-shape'));
    btn.onclick = function() { pickShape(btn.getAttribute('data-shape')); };
  }
  function bindChip(chip) {
    makeSpeakable(chip, chip.getAttribute('data-shape'));
    chip.onclick = function() { chip.classList.toggle('tapped'); refreshCount(); };
  }
  function bindCell(btn) {
    makeSpeakable(btn, btn.getAttribute('data-cell'));
    btn.onclick = function() { CELL[btn.getAttribute('data-has')](btn); };
  }
  function bindTile(tile) {
    makeSpeakable(tile, tile.getAttribute('data-tile'));
    tile.onclick = function() { PLACE[String(isCorrectPlacement(strokesOf(), state.placed, tile.getAttribute('data-tile')))](tile, tile.getAttribute('data-tile')); };
  }

  function render() {
    panel.innerHTML = PANELS[state.mode]();
    panel.querySelectorAll('[data-letter]').forEach(bindLetter);
    panel.querySelectorAll('.pick.shape').forEach(bindShape);
    panel.querySelectorAll('.chip').forEach(bindChip);
    panel.querySelectorAll('[data-cell]').forEach(bindCell);
    panel.querySelectorAll('[data-tile]').forEach(bindTile);
  }

  function selectMode(tab) {
    state.mode = tab.getAttribute('data-mode');
    state.placed = [];
    state.eventFired = false;
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.toggle('on', t === tab); });
    render();
  }
  function bindTab(tab) {
    makeSpeakable(tab, tab.textContent);
    tab.onclick = function() { selectMode(tab); };
  }

  document.querySelectorAll('.tab').forEach(bindTab);
  fetch(REGISTRY).then(toJson).then(function(data) { shapeMap = buildLetterShapeMap(data); render(); });
}
