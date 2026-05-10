export function makeLongPress(el, onFire, holdMs, onPress, onRelease) {
  var timer = null;
  function _start() {
    [onPress].filter(Boolean).forEach(function(fn) { fn(); });
    timer = setTimeout(function() {
      timer = null;
      [onRelease].filter(Boolean).forEach(function(fn) { fn(); });
      onFire();
    }, holdMs);
  }
  function _reset() {
    clearTimeout(timer);
    timer = null;
    [onRelease].filter(Boolean).forEach(function(fn) { fn(); });
  }
  el.addEventListener('pointerdown', _start);
  el.addEventListener('pointerup', _reset);
  el.addEventListener('pointerleave', _reset);
  el.addEventListener('pointercancel', _reset);
}
