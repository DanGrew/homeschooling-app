import { hourToSky } from '../../core/clock/clock-core.js';
import { makeSpeakable } from '../../components/speech/speakable.js';

var TILE_BASE = 'flex:1 1 calc(50% - 8px);min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px 8px;border:3px solid rgba(255,255,255,0.4);border-radius:18px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:clamp(0.85em,3vw,1.1em);color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);touch-action:manipulation;user-select:none;';

function buildTile(preset, isCorrect, onPick) {
  var sky = hourToSky(parseInt(preset.time.split(':')[0], 10));
  var tile = document.createElement('button');
  tile.style.cssText = TILE_BASE + 'background:linear-gradient(to bottom,' + sky.topColor + ',' + sky.bottomColor + ');';
  var em = document.createElement('span');
  em.style.cssText = 'font-size:clamp(1.4em,5vw,2em);';
  em.textContent = preset.emoji;
  var lbl = document.createElement('span');
  lbl.textContent = preset.label;
  tile.appendChild(em);
  tile.appendChild(lbl);
  tile.addEventListener('click', function() { onPick(tile, isCorrect); });
  makeSpeakable(tile, preset.label);
  return tile;
}

function buildTextTile(label, isCorrect, onPick) {
  var tile = document.createElement('button');
  tile.style.cssText = TILE_BASE + 'background:rgba(255,255,255,0.2);font-size:clamp(1em,3.5vw,1.3em);text-transform:capitalize;';
  tile.textContent = label;
  tile.addEventListener('click', function() { onPick(tile, isCorrect); });
  makeSpeakable(tile, label);
  return tile;
}

export function renderChoices(container, presets, indices, correctIdx, onPick) {
  container.innerHTML = '';
  indices.forEach(function(i) {
    container.appendChild(buildTile(presets[i], i === correctIdx, onPick));
  });
}

var BUILD_TILE_FN = {
  'true':  function(opt, onPick) { return buildTile(opt.preset, opt.correct, onPick); },
  'false': function(opt, onPick) { return buildTextTile(opt.label, opt.correct, onPick); }
};

export function renderMultiChoiceOptions(container, options, onPick) {
  container.innerHTML = '';
  options.forEach(function(opt) {
    container.appendChild(BUILD_TILE_FN[String(!!opt.preset)](opt, onPick));
  });
}
