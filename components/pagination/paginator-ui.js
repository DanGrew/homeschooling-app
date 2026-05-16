import { createPaginatorState } from '../../core/pagination/paginator-core.js';
import { makeSpeakable } from '../speech/speakable.js';

export function createPaginator({ container, items, perPage = 1, onRender, wrap = false }) {
  var state = createPaginatorState({ items, perPage, wrap });

  var bar = document.createElement('div');
  bar.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:16px;padding:6px 16px 44px;';

  var btnPrev = document.createElement('button');
  btnPrev.innerHTML = '&#8592; Prev';
  btnPrev.style.cssText = 'font-size:clamp(0.9em,3vmin,1.4em);padding:clamp(6px,1.2vmin,12px) clamp(14px,2.5vw,24px);border:none;border-radius:14px;background:#2ECC71;color:#fff;font-family:inherit;cursor:pointer;touch-action:manipulation;user-select:none;';
  makeSpeakable(btnPrev, 'Previous');

  var indicator = document.createElement('span');
  indicator.style.cssText = 'font-size:clamp(0.85em,2.5vmin,1.2em);color:#555;min-width:90px;text-align:center;';

  var btnNext = document.createElement('button');
  btnNext.innerHTML = 'Next &#8594;';
  btnNext.style.cssText = btnPrev.style.cssText;
  makeSpeakable(btnNext, 'Next');

  bar.appendChild(btnPrev);
  bar.appendChild(indicator);
  bar.appendChild(btnNext);
  container.appendChild(bar);

  var _applyDisabled = wrap
    ? function() {}
    : function() { btnPrev.disabled = state.isAtStart(); btnNext.disabled = state.isAtEnd(); };

  function _update() {
    indicator.textContent = 'Page ' + (state.getPage() + 1) + ' of ' + state.getPageCount();
    _applyDisabled();
    onRender(state.getSlice(), state.getPage());
  }

  function next() { state.next(); _update(); }
  function prev() { state.prev(); _update(); }
  function reset(newItems) { state.reset(newItems); _update(); }
  function goTo(idx) { state.goTo(idx); _update(); }
  function disable() { btnPrev.disabled = true; btnNext.disabled = true; }
  function enable() { btnPrev.disabled = false; btnNext.disabled = false; }

  btnPrev.addEventListener('click', prev);
  btnNext.addEventListener('click', next);

  return { next, prev, reset, goTo, disable, enable };
}
