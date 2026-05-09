var AUTO_DISPLAY = { 'true': '', 'false': 'none' };
var BUILD_ACTION = { 'true': function() {}, 'false': function(o, s) { o._build(s); } };

export function GuidanceOverlay() {
  this._el = null;
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
  bubble.style.cssText = 'background:#fff;border-radius:16px 16px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,0.12);padding:14px 16px;display:flex;align-items:center;gap:14px;';

  var char = document.createElement('img');
  char.style.cssText = 'width:52px;height:52px;object-fit:contain;flex-shrink:0;border-radius:50%;background:#f5f5f5;';
  this._charEl = char;

  var body = document.createElement('div');
  body.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:8px;min-width:0;';

  var text = document.createElement('div');
  text.style.cssText = 'font-size:1.05em;font-weight:600;color:#222;line-height:1.3;';
  this._textEl = text;

  var footer = document.createElement('div');
  footer.style.cssText = 'display:flex;align-items:center;gap:8px;';

  var progress = document.createElement('span');
  progress.style.cssText = 'font-size:0.75em;color:#aaa;margin-right:auto;';
  this._progressEl = progress;

  var replay = document.createElement('button');
  replay.innerHTML = '&#9654;';
  replay.title = 'Replay';
  replay.style.cssText = 'width:30px;height:30px;border-radius:50%;border:2px solid #2563EB;color:#2563EB;background:none;cursor:pointer;font-size:0.7em;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
  replay.addEventListener('click', function() { [self._onReplay].filter(Boolean).forEach(function(fn) { fn(); }); });

  var next = document.createElement('button');
  next.textContent = 'Next \u2192';
  next.style.cssText = 'background:#2563EB;color:#fff;border:none;border-radius:20px;padding:5px 16px;font-size:0.85em;font-weight:700;cursor:pointer;flex-shrink:0;';
  next.addEventListener('click', function() { [self._onNext].filter(Boolean).forEach(function(fn) { fn(); }); });
  this._nextBtn = next;

  var close = document.createElement('button');
  close.innerHTML = '&times;';
  close.title = 'Stop lesson';
  close.style.cssText = 'width:30px;height:30px;border-radius:50%;border:none;background:#f0f0f0;color:#888;cursor:pointer;font-size:1.1em;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
  close.addEventListener('click', onStop);

  footer.appendChild(progress);
  footer.appendChild(replay);
  footer.appendChild(next);
  footer.appendChild(close);
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
  this._textEl.textContent = step.text;
  this._progressEl.textContent = idx + ' / ' + total;
  this._nextBtn.style.display = AUTO_DISPLAY[String(!!step.auto)];
  this._el.style.display = '';
};

GuidanceOverlay.prototype.hide = function() {
  [this._el].filter(Boolean).forEach(function(el) { el.style.display = 'none'; });
};
