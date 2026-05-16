(function () {
  var activity = window.ADULT_PROMPTS_ACTIVITY;

  var idx = 0;
  var prompts = [];
  var pressTimer = null;
  var HOLD_MS = 600;
  var CIRCUMFERENCE = 138;

  var TYPE_LABEL = { ask: 'ASK', say: 'SAY', word: 'WORD' };
  var TYPE_COLOR = { ask: '#5B8DB8', say: '#6B9E78', word: '#8B6BAE' };

  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;bottom:16px;right:16px;width:44px;height:44px;z-index:9000;touch-action:none;';
  wrap.setAttribute('data-testid', 'adult-prompts-btn');

  var btn = document.createElement('div');
  btn.style.cssText = 'position:absolute;top:0;left:0;width:44px;height:44px;border-radius:50%;background:#fff;border:2px solid #ddd;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);user-select:none;-webkit-user-select:none;';
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

  var ringNs = 'http://www.w3.org/2000/svg';
  var ringSvg = document.createElementNS(ringNs, 'svg');
  ringSvg.style.cssText = 'position:absolute;top:-4px;left:-4px;width:52px;height:52px;pointer-events:none;transform:rotate(-90deg);';
  ringSvg.setAttribute('viewBox', '0 0 52 52');
  var arc = document.createElementNS(ringNs, 'circle');
  arc.setAttribute('cx', '26'); arc.setAttribute('cy', '26'); arc.setAttribute('r', '22');
  arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', '#888'); arc.setAttribute('stroke-width', '3');
  arc.setAttribute('stroke-dasharray', CIRCUMFERENCE); arc.setAttribute('stroke-dashoffset', CIRCUMFERENCE);
  ringSvg.appendChild(arc);
  wrap.appendChild(btn);
  wrap.appendChild(ringSvg);

  var card = document.createElement('div');
  card.style.cssText = 'position:fixed;bottom:70px;right:12px;width:268px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.16);border:1.5px solid #eee;z-index:9001;display:none;flex-direction:column;overflow:hidden;';
  card.setAttribute('data-testid', 'adult-prompts-card');

  var typeCol = function(type) { return [TYPE_COLOR[type]].filter(Boolean).concat(['#999'])[0]; };
  var typeLbl = function(type) { return [TYPE_LABEL[type]].filter(Boolean).concat([type.toUpperCase()])[0]; };

  function renderCard() {
    var p = prompts[idx];
    var col = typeCol(p.type);
    var lbl = typeLbl(p.type);
    card.innerHTML =
      '<div style="background:#f8f8f8;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eee;">' +
        '<div style="display:flex;align-items:center;gap:7px;">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
          '<span style="font-size:0.72em;color:#bbb;font-weight:700;letter-spacing:0.07em;">FOR YOU</span>' +
        '</div>' +
        '<div data-testid="adult-prompts-close" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#ccc;font-size:1em;border-radius:6px;">&#x2715;</div>' +
      '</div>' +
      '<div style="padding:14px 14px 10px;">' +
        '<div data-testid="adult-prompts-type" style="display:inline-block;background:' + col + '1a;color:' + col + ';font-size:0.68em;font-weight:800;letter-spacing:0.1em;padding:3px 9px;border-radius:6px;margin-bottom:10px;">' + lbl + '</div>' +
        '<div data-testid="adult-prompts-text" style="font-size:0.92em;color:#333;line-height:1.55;">' + p.text + '</div>' +
      '</div>' +
      '<div style="padding:8px 12px 12px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f0f0f0;">' +
        '<div data-testid="adult-prompts-prev" style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#ccc;font-size:1.3em;border-radius:8px;background:#f5f5f5;line-height:1;">&#8249;</div>' +
        '<span data-testid="adult-prompts-count" style="font-size:0.75em;color:#ccc;">' + (idx + 1) + '\u202f/\u202f' + prompts.length + '</span>' +
        '<div data-testid="adult-prompts-next" style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#ccc;font-size:1.3em;border-radius:8px;background:#f5f5f5;line-height:1;">&#8250;</div>' +
      '</div>';

    card.querySelector('[data-testid="adult-prompts-close"]').addEventListener('click', closeCard);
    card.querySelector('[data-testid="adult-prompts-prev"]').addEventListener('click', function () { idx = (idx - 1 + prompts.length) % prompts.length; renderCard(); });
    card.querySelector('[data-testid="adult-prompts-next"]').addEventListener('click', function () { idx = (idx + 1) % prompts.length; renderCard(); });
  }

  function openCard() { card.style.display = 'flex'; renderCard(); }
  function closeCard() { card.style.display = 'none'; }

  function startPress() {
    arc.style.transition = 'stroke-dashoffset ' + HOLD_MS + 'ms linear';
    arc.setAttribute('stroke-dashoffset', '0');
    pressTimer = setTimeout(function () { resetPress(); openCard(); }, HOLD_MS);
  }

  function resetPress() {
    clearTimeout(pressTimer);
    pressTimer = null;
    arc.style.transition = 'none';
    arc.setAttribute('stroke-dashoffset', CIRCUMFERENCE);
  }

  wrap.addEventListener('pointerdown', startPress);
  wrap.addEventListener('pointerup', resetPress);
  wrap.addEventListener('pointerleave', resetPress);
  wrap.addEventListener('pointercancel', resetPress);

  var CONTENT_BASE = window.location.pathname.replace(/\/app\/.*$/, '/') + 'content/adult-prompts/';

  [activity].filter(Boolean).forEach(function (act) {
    fetch(CONTENT_BASE + act + '.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        [data.prompts].filter(Boolean).filter(function (p) { return p.length; }).forEach(function (p) {
          prompts = p;
          document.body.appendChild(wrap);
          document.body.appendChild(card);
        });
      });
  });
})();
