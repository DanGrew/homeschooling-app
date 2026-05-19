import { speak } from '../speech/speech-ui.js';

var _styleInjected = false;
function _injectStyle() {
  if (_styleInjected) return;
  _styleInjected = true;
  var s = document.createElement('style');
  s.textContent = '@keyframes wbPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}';
  document.head.appendChild(s);
}

export function WordBubble() {
  _injectStyle();
  this._el = null;
  this._textEl = null;
  this._word = null;
}

WordBubble.prototype.build = function(parent) {
  var self = this;

  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);display:none;flex-direction:column;align-items:center;gap:3px;cursor:pointer;z-index:100;';

  var bubble = document.createElement('div');
  bubble.style.cssText = 'background:#fff8e7;border:3px solid #f0c060;border-radius:20px;padding:8px 18px;font-size:1.1em;font-weight:900;color:#b06000;white-space:nowrap;animation:wbPulse 1.4s ease-in-out infinite;';
  this._textEl = bubble;

  var dots = document.createElement('div');
  dots.style.cssText = 'display:flex;gap:4px;align-items:flex-end;';
  [7, 5, 3].forEach(function(sz) {
    var d = document.createElement('div');
    d.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;background:#f0c060;flex-shrink:0;';
    dots.appendChild(d);
  });

  wrap.appendChild(bubble);
  wrap.appendChild(dots);
  this._el = wrap;
  parent.appendChild(wrap);

  wrap.addEventListener('click', function() {
    [self._word].filter(Boolean).forEach(function(w) {
      speak(w);
      setTimeout(function() {
        window.dispatchEvent(new CustomEvent('guidance:event', { detail: { type: 'BADGE_TAPPED' } }));
      }, 900);
    });
  });
};

WordBubble.prototype.show = function(word) {
  this._word = word;
  if (this._textEl) this._textEl.textContent = word.toUpperCase();
  if (this._el) this._el.style.display = 'flex';
};

WordBubble.prototype.hide = function() {
  if (this._el) this._el.style.display = 'none';
  this._word = null;
};
