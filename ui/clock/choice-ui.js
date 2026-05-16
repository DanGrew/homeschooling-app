import { hourToSky } from '../../core/clock/clock-core.js';
import { makeSpeakable } from '../../components/speech/speakable.js';

function buildTile(preset, isCorrect, onPick) {
  var sky = hourToSky(preset.hour);
  var tile = document.createElement('button');
  tile.style.cssText = 'flex:1 1 calc(50% - 8px);min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px 8px;border:3px solid rgba(255,255,255,0.4);border-radius:18px;cursor:pointer;font-family:inherit;font-weight:bold;font-size:clamp(0.85em,3vw,1.1em);color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);background:linear-gradient(to bottom,' + sky.topColor + ',' + sky.bottomColor + ');touch-action:manipulation;user-select:none;';
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

export function renderChoices(container, presets, indices, correctIdx, onPick) {
  container.innerHTML = '';
  indices.forEach(function(i) {
    container.appendChild(buildTile(presets[i], i === correctIdx, onPick));
  });
}
