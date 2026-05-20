import { makeLongPress } from '../../ui/shared/long-press.js';
import { WordBubble } from './word-bubble.js';

var AUTO_DISPLAY  = { 'true': '',        'false': 'none'  };
var BUBBLE_BG     = { 'success': '#2ECC71', 'auto': '#D5F5E3', 'expect': '#D6EAF8', 'failure': '#FAD7A0' };
var BUBBLE_COLOR  = { 'success': '#fff',    'auto': '#222',    'expect': '#222',    'failure': '#222'    };
var BUBBLE_KEY    = { 'true-true': 'success', 'true-false': 'success', 'false-true': 'auto', 'false-false': 'expect' };
var SUCCESS_TEXT  = { 'true': function(t) { return '\u2B50 ' + t; }, 'false': function(t) { return t; } };
var BUILD_ACTION  = { 'true': function() {}, 'false': function(o, s) { o._build(s); } };

export function GuidanceOverlay() {
  this._el = null;
  this._bubbleEl = null;
  this._textEl = null;
  this._dotsEl = null;
  this._failDotsEl = null;
  this._progressEl = null;
  this._nextBtn = null;
  this._charEl = null;
  this._wordBubble = null;
  this._onNext = null;
  this._onReplay = null;
}

GuidanceOverlay.prototype._build = function(onStop) {
  var self = this;

  var el = document.createElement('div');
  el.id = 'guidance-overlay';
  el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9500;display:none;padding:8px 8px 0;box-sizing:border-box;';

  var bubble = document.createElement('div');
  bubble.style.cssText = 'background:#fff;border-radius:16px 16px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,0.12);padding:10px 14px;display:flex;align-items:stretch;gap:12px;transition:background 0.3s;';
  this._bubbleEl = bubble;

  var charWrap = document.createElement('div');
  charWrap.style.cssText = 'position:relative;flex-shrink:0;align-self:center;width:48px;height:48px;';

  var char = document.createElement('img');
  char.style.cssText = 'width:48px;height:48px;object-fit:contain;border-radius:50%;background:#f5f5f5;display:block;';
  this._charEl = char;
  charWrap.appendChild(char);

  this._wordBubble = new WordBubble();
  this._wordBubble.build(charWrap);

  var body = document.createElement('div');
  body.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;';

  var text = document.createElement('div');
  text.style.cssText = 'flex:1;display:flex;align-items:center;font-size:1.05em;font-weight:600;line-height:1.3;white-space:pre-line;';
  this._textEl = text;

  var footer = document.createElement('div');
  footer.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0;';

  var progress = document.createElement('span');
  progress.style.cssText = 'font-size:0.75em;color:#aaa;margin-right:auto;';
  this._progressEl = progress;

  var next = document.createElement('button');
  next.innerHTML = '&#9654;';
  next.dataset.action = 'next';
  next.style.cssText = 'width:40px;height:40px;border-radius:50%;background:#2ECC71;color:#fff;border:none;font-size:1.2em;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;';
  next.addEventListener('click', function() { [self._onNext].filter(Boolean).forEach(function(fn) { fn(); }); });
  this._nextBtn = next;

  var replay = document.createElement('button');
  replay.innerHTML = '&#8635;';
  replay.title = 'Replay';
  replay.style.cssText = 'width:28px;height:28px;border-radius:50%;border:2px solid #aaa;color:#aaa;background:none;cursor:pointer;font-size:1em;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
  replay.addEventListener('click', function() { [self._onReplay].filter(Boolean).forEach(function(fn) { fn(); }); });

  var closeWrap = document.createElement('div');
  closeWrap.style.cssText = 'position:relative;width:28px;height:28px;flex-shrink:0;';

  var close = document.createElement('button');
  close.innerHTML = '&times;';
  close.title = 'Stop lesson';
  close.style.cssText = 'position:absolute;top:0;left:0;width:28px;height:28px;border-radius:50%;border:none;background:#f0f0f0;color:#888;cursor:pointer;font-size:1.1em;display:flex;align-items:center;justify-content:center;';

  var ARC_NS = 'http://www.w3.org/2000/svg';
  var ARC_C = 94;
  var arcSvg = document.createElementNS(ARC_NS, 'svg');
  arcSvg.style.cssText = 'position:absolute;top:-4px;left:-4px;width:36px;height:36px;pointer-events:none;transform:rotate(-90deg);';
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

  footer.appendChild(progress);
  footer.appendChild(next);
  footer.appendChild(replay);
  footer.appendChild(closeWrap);
  var dots = document.createElement('div');
  dots.style.cssText = 'display:none;flex-direction:row;gap:8px;justify-content:center;padding-top:4px;';
  this._dotsEl = dots;

  var failDots = document.createElement('div');
  failDots.style.cssText = 'display:none;flex-direction:row;gap:8px;justify-content:center;padding-top:4px;';
  this._failDotsEl = failDots;

  body.appendChild(text);
  body.appendChild(dots);
  body.appendChild(failDots);
  body.appendChild(footer);
  bubble.appendChild(charWrap);
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
  var bgKey = BUBBLE_KEY[String(!!step.success) + '-' + String(!!step.auto)];
  this._bubbleEl.style.background = BUBBLE_BG[bgKey];
  this._textEl.style.color = BUBBLE_COLOR[bgKey];
  this._textEl.textContent = SUCCESS_TEXT[String(!!step.success)](step.text);
  this._progressEl.textContent = idx + ' / ' + total;
  var showNext = !!step.auto;
  this._nextBtn.style.display = AUTO_DISPLAY[String(showNext)];
  this._nextBtn.classList.toggle('speakable', showNext);
  this._renderDots(step.dots || 0, 0);
  this._renderFailDots(step.failDots || 0, 0);
  var wb = this._wordBubble;
  [wb].filter(Boolean).forEach(function() { step.badge ? wb.show(step.badge) : wb.hide(); });
  this._el.style.display = '';
};

GuidanceOverlay.prototype._renderDots = function(total, ticked) {
  this._dotsEl.innerHTML = '';
  this._dotsEl.style.display = total > 0 ? 'flex' : 'none';
  for (var i = 0; i < total; i++) {
    var box = document.createElement('span');
    var checked = i < ticked;
    box.style.cssText = 'width:18px;height:18px;border-radius:4px;border:2px solid ' + (checked ? '#2ECC71' : '#bbb') + ';background:' + (checked ? '#2ECC71' : 'transparent') + ';display:inline-flex;align-items:center;justify-content:center;transition:background 0.2s,border-color 0.2s;box-sizing:border-box;font-size:0.85em;color:#fff;font-weight:bold;';
    box.textContent = checked ? '\u2713' : '';
    this._dotsEl.appendChild(box);
  }
};

GuidanceOverlay.prototype.setDots = function(ticked, total) {
  this._renderDots(total, ticked);
};

GuidanceOverlay.prototype._renderFailDots = function(total, crossed) {
  this._failDotsEl.innerHTML = '';
  this._failDotsEl.style.display = total > 0 ? 'flex' : 'none';
  for (var i = 0; i < total; i++) {
    var box = document.createElement('span');
    var filled = i < crossed;
    box.style.cssText = 'width:18px;height:18px;border-radius:4px;border:2px solid ' + (filled ? '#E74C3C' : '#bbb') + ';background:' + (filled ? '#E74C3C' : 'transparent') + ';display:inline-flex;align-items:center;justify-content:center;transition:background 0.2s,border-color 0.2s;box-sizing:border-box;font-size:0.85em;color:#fff;font-weight:bold;';
    box.textContent = filled ? '\u2717' : '';
    this._failDotsEl.appendChild(box);
  }
};

GuidanceOverlay.prototype.setFailureDots = function(crossed, total) {
  this._renderFailDots(total, crossed);
};

GuidanceOverlay.prototype.showFailure = function(guideSrc, text, onStop) {
  BUILD_ACTION[String(!!this._el)](this, onStop);
  this._charEl.src = guideSrc;
  this._onNext = onStop;
  this._onReplay = null;
  this._bubbleEl.style.background = BUBBLE_BG['failure'];
  this._textEl.style.color = BUBBLE_COLOR['failure'];
  this._textEl.textContent = text;
  this._progressEl.textContent = '';
  this._nextBtn.style.display = '';
  this._nextBtn.classList.toggle('speakable', true);
  this._renderDots(0, 0);
  this._renderFailDots(0, 0);
  [this._wordBubble].filter(Boolean).forEach(function(wb) { wb.hide(); });
  this._el.style.display = '';
};

GuidanceOverlay.prototype.hide = function() {
  [this._el].filter(Boolean).forEach(function(el) { el.style.display = 'none'; });
  [this._wordBubble].filter(Boolean).forEach(function(wb) { wb.hide(); });
};
