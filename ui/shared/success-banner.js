var _el = null;
var _type = 'strip';

var BASE_STYLE = {
  strip:      'position:fixed;bottom:0;left:0;right:0;background:#2ECC71;color:white;display:flex;align-items:center;justify-content:space-between;padding:14px 20px;transform:translateY(100%);transition:transform 0.3s ease;z-index:9100;box-sizing:border-box;font-family:inherit;',
  fullscreen: 'position:fixed;inset:0;background:rgba(39,174,96,0.95);display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:2.8em;font-weight:bold;text-align:center;z-index:9100;'
};

var SHOW_FN = {
  strip:      function(el) { el.style.transform = 'translateY(0)'; },
  fullscreen: function(el) { el.style.display = 'flex'; }
};

var HIDE_FN = {
  strip:      function(el) { el.style.transform = 'translateY(100%)'; },
  fullscreen: function(el) { el.style.display = 'none'; }
};

var TEXT_SIZE   = { strip: '1.6em', fullscreen: '0.65em' };
var MARGIN_TOP  = { strip: '',      fullscreen: 'margin-top:8px;' };
var TYPE_MAP    = { 'true': 'fullscreen', 'false': 'strip' };

var _SWAP = {
  'true':  { 'true': function() { _el.remove(); _el = null; }, 'false': function() {} },
  'false': { 'true': function() {}, 'false': function() {} }
};

var _CREATE = {
  'true':  function() {},
  'false': function(type) {
    _type = type;
    _el = document.createElement('div');
    _el.style.cssText = BASE_STYLE[type];
    document.body.appendChild(_el);
  }
};

var _BUILD_BTN = {
  strip: function(b) {
    var btn = document.createElement('button');
    btn.textContent = b.label;
    var bg    = [b.bg].filter(Boolean).concat(['white'])[0];
    var color = [b.color].filter(Boolean).concat(['#2ECC71'])[0];
    btn.style.cssText = 'border:none;font-size:1.2em;padding:10px 24px;border-radius:12px;font-family:inherit;cursor:pointer;font-weight:bold;margin:4px;background:' + bg + ';color:' + color + ';';
    btn.addEventListener('click', b.onClick);
    return btn;
  },
  fullscreen: function(b) {
    var btn = document.createElement('button');
    btn.textContent = b.label;
    btn.style.cssText = 'margin-top:24px;padding:14px 32px;border:3px solid #fff;border-radius:16px;background:transparent;color:#fff;font-family:inherit;font-size:0.55em;cursor:pointer;';
    btn.addEventListener('click', b.onClick);
    return btn;
  }
};

export function showBanner(opts) {
  var type = TYPE_MAP[String(!!opts.fullscreen)];
  _SWAP[String(!!_el)][String(_type !== type)]();
  _CREATE[String(!!_el)](type);
  _el.innerHTML = '';
  [opts.icon].filter(Boolean).forEach(function(icon) {
    var iconEl = document.createElement('span');
    iconEl.textContent = icon;
    _el.appendChild(iconEl);
  });
  var span = document.createElement('span');
  span.textContent = [opts.text].filter(Boolean).concat(['\u2B50 Well done!'])[0];
  span.style.cssText = 'font-size:' + TEXT_SIZE[type] + ';' + MARGIN_TOP[type];
  _el.appendChild(span);
  var btnWrap = document.createElement('div');
  [].concat(opts.buttons).filter(Boolean).forEach(function(b) { btnWrap.appendChild(_BUILD_BTN[type](b)); });
  _el.appendChild(btnWrap);
  SHOW_FN[type](_el);
}

export function hideBanner() {
  [_el].filter(Boolean).forEach(function(el) { HIDE_FN[_type](el); });
}

window.showBanner = function(onNext) { showBanner({ buttons: [{ label: 'Next \u2192', onClick: onNext }] }); };
window.hideBanner = hideBanner;
