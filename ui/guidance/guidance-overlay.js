import { makeLongPress } from '../shared/long-press.js';

var AUTO_DISPLAY  = { 'true': '',        'false': 'none'  };
var BUBBLE_BG     = { 'success': '#2ECC71', 'auto': '#D5F5E3', 'expect': '#D6EAF8' };
var BUBBLE_COLOR  = { 'success': '#fff',    'auto': '#222',    'expect': '#222'    };
var SUCCESS_TEXT  = { 'true': function(t) { return '\u2B50 ' + t; }, 'false': function(t) { return t; } };
var BUILD_ACTION  = { 'true': function() {}, 'false': function(o, s) { o._build(s); } };

export function GuidanceOverlay() {
  this._el = null;
  this._bubbleEl = null;
  this._textEl = null;
  this._progressEl = null;
  this._nextBtn = null;
  this._charEl = null;
  this._onNext = null;
  this._onReplay = null;
}

GuidanceOverlay.prototype._build = function(onStop) {
  var self = this;

  var el = document.createElement('div');
  el.id = 'guidance-overlay';
  el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9500;display:none;padding:12px;box-sizing:border-box;';

  var bubble = document.createElement('div');
  bubble.style.cssText = 'background:#fff;border-radius:16px 16px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,0.12);padding:14px 16px;display:flex;align-items:center;gap:14px;transition:background 0.3s;';
  this._bubbleEl = bubble;

  var char = document.createElement('img');
  char.style.cssText = 'width:52px;height:52px;object-fit:contain;flex-shrink:0;border-radius:50%;background:#f5f5f5;';
  this._charEl = char;

  var body = document.createElement('div');
  body.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:8px;min-width:0;';

  var text = document.createElement('div');
  text.style.cssText = 'font-size:1.05em;font-weight:600;line-height:1.3;';
  this._textEl = text;

  var footer = document.createElement('div');
  footer.style.cssText = 'display:flex;align-items:center;gap:8px;';

  var progress = document.createElement('span');
  progress.style.cssText = 'font-size:0.75em;color:#aaa;margin-right:auto;';
  this._progressEl = progress;

  var next = document.createElement('button');
  next.innerHTML = '&#9654;';
  next.dataset.action = 'next';
  next.style.cssText = 'width:44px;height:44px;border-radius:50%;background:#2ECC71;color:#fff;border:none;font-size:1.3em;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;';
  next.addEventListener('click', function() { [self._onNext].filter(Boolean).forEach(function(fn) { fn(); }); });
  this._nextBtn = next;

  var replay = document.createElement('button');
  replay.innerHTML = '&#8635;';
  replay.title = 'Replay';
  replay.style.cssText = 'width:30px;height:30px;border-radius:50%;border:2px solid #aaa;color:#aaa;background:none;cursor:pointer;font-size:1em;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
  replay.addEventListener('click', function() { [self._onReplay].filter(Boolean).forEach(function(fn) { fn(); }); });

  var closeWrap = document.createElement('div');
  closeWrap.style.cssText = 'position:relative;width:30px;height:30px;flex-shrink:0;';

  var close = document.createElement('button');
  close.innerHTML = '&times;';
  close.title = 'Stop lesson';
  close.style.cssText = 'position:absolute;top:0;left:0;width:30px;height:30px;border-radius:50%;border:none;background:#f0f0f0;color:#888;cursor:pointer;font-size:1.1em;display:flex;align-items:center;justify-content:center;';

  var ARC_NS = 'http://www.w3.org/2000/svg';
  var ARC_C = 94;
  var arcSvg = document.createElementNS(ARC_NS, 'svg');
  arcSvg.style.cssText = 'position:absolute;top:-4px;left:-4px;width:38px;height:38px;pointer-events:none;transform:rotate(-90deg);';
  arcSvg.setAttribute('viewBox', '0 0 38 38');
  var closeArc = document.createElementNS(ARC_NS, 'circle');
  closeArc.setAttribute('cx', '19'); closeArc.setAttribute('cy', '19'); closeArc.setAttribute('r', '15');
  closeArc.setAttribute('fill', 'none'); closeArc.setAttribute('stroke', '#888'); closeArc.setAttribute('stroke-width', '2.5');
  closeArc.setAttribute('stroke-dasharray', ARC_C); closeArc.setAttribute('stroke-dashoffset', ARC_C);
  arcSvg.appendChild(closeArc);

  makeLongPress(closeWrap, onStop, 600,
    function() { closeArc.style.transition = 'stroke-dashoffset 600ms linear'; closeArc.setAttribute('stroke-dashoffset', '0'); },
    function() { closeArc.style.transition = 'none'; closeArc.setAttribute('stroke-dashoffset', ARC_C); }
  );

  closeWrap.appendChild(close);
  closeWrap.appendChild(arcSvg);

  var controls = document.createElement('div');
  controls.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;';
  controls.appendChild(replay);
  controls.appendChild(closeWrap);

  footer.appendChild(progress);
  footer.appendChild(next);
  footer.appendChild(controls);
  body.appendChild(text);
  body.appendChild(footer);
  bubble.appendChild(char);
  bubble.appendChild(body);
  el.appendChild(bubble);
  document.body.appendChild(el);
  this._el = el;
};

GuidanceOverlay.prototype.show = function(guideSrc, step, idx, total, onNext, onReplay, onStop) {
  BUILD_ACTION[String(!!this._el)](this, onStop);
  this._charEl.src = guideSrc;
  this._onNext = onNext;
  this._onReplay = onReplay;
  var bgKey = step.success ? 'success' : step.auto ? 'auto' : 'expect';
  this._bubbleEl.style.background = BUBBLE_BG[bgKey];
  this._textEl.style.color = BUBBLE_COLOR[bgKey];
  this._textEl.textContent = SUCCESS_TEXT[String(!!step.success)](step.text);
  this._progressEl.textContent = idx + ' / ' + total;
  var showNext = !!step.auto;
  this._nextBtn.style.display = AUTO_DISPLAY[String(showNext)];
  this._nextBtn.classList.toggle('speakable', showNext);
  this._el.style.display = '';
};

GuidanceOverlay.prototype.hide = function() {
  [this._el].filter(Boolean).forEach(function(el) { el.style.display = 'none'; });
};
