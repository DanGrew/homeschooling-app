var PAIRS_GRID_COLS = { 16: 4, 36: 6, 64: 8 };

var PAIRS_ROLES = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' }
];

var PAIRS_SEL    = { 'true': ' selected',    'false': '' };
var PAIRS_ACTIVE = { 'true': ' active-turn', 'false': '' };
var PAIRS_NOOP   = function() {};

function pairsSpeak(text) {
  [window.__speakInterrupt].filter(Boolean).forEach(function(fn) { fn(text); });
}
function pairsMakeSpeak(el, text) {
  el.classList.add('speakable');
  el.setAttribute('data-speak', text);
  [window.__makeSpeakable].filter(Boolean).forEach(function(fn) { fn(el, text); });
}

function pairsImgSrc(id) {
  return window.DICT_BASE + id + '/' + id + '.svg';
}

// ---- Setup ----

function renderPairsSetup(container, fruitEntries, animalEntries, onStart) {
  var cfg = {
    playerCount: 2,
    gridSize: 16,
    mode: 'shared',
    players: [
      { name: '', icon: null, role: 'adult' },
      { name: '', icon: null, role: 'adult' },
      { name: '', icon: null, role: 'adult' }
    ]
  };

  function redraw() {
    container.innerHTML = '';
    container.appendChild(buildSetupRoot(cfg, animalEntries, function(patch) {
      Object.assign(cfg, patch);
      redraw();
    }, function() { onStart(cfg); }));
  }

  redraw();
}

function buildSetupRoot(cfg, animalEntries, onChange, onStart) {
  var root = document.createElement('div');
  root.className = 'pairs-setup-scroll';

  root.appendChild(buildCountSection(cfg.playerCount, onChange));

  cfg.players.slice(0, cfg.playerCount).forEach(function(player, i) {
    root.appendChild(buildPlayerPanel(i, player, animalEntries, cfg.players, onChange));
  });

  root.appendChild(buildSizeSection(cfg.gridSize, onChange));

  [buildModeSection(cfg.mode, onChange)]
    .filter(function() { return cfg.playerCount === 2; })
    .forEach(function(el) { root.appendChild(el); });

  root.appendChild(buildStartButton(cfg, onStart));
  return root;
}

function buildCountSection(playerCount, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'How many players?';
  pairsMakeSpeak(label, label.textContent);
  section.appendChild(label);
  [2, 3].forEach(function(n) {
    var btn = document.createElement('button');
    btn.textContent = n + ' players';
    btn.className = 'pairs-count-btn' + PAIRS_SEL[String(playerCount === n)];
    btn.setAttribute('data-testid', 'player-count-' + n);
    btn.addEventListener('click', function() { onChange({ playerCount: n }); });
    pairsMakeSpeak(btn, btn.textContent);
    section.appendChild(btn);
  });
  return section;
}

function buildPlayerPanel(idx, player, animalEntries, allPlayers, onChange) {
  var takenIcons = allPlayers.filter(function(p, i) { return i !== idx; })
    .map(function(p) { return p.icon; })
    .filter(Boolean);

  var panel = document.createElement('div');
  panel.className = 'pairs-player-panel';
  panel.setAttribute('data-testid', 'player-panel-' + idx);

  var header = document.createElement('div');
  header.className = 'pairs-player-header';

  var label = document.createElement('p');
  label.textContent = 'Player ' + (idx + 1);
  pairsMakeSpeak(label, label.textContent);
  header.appendChild(label);

  var roleSelect = document.createElement('select');
  roleSelect.className = 'pairs-role-select';
  roleSelect.setAttribute('data-testid', 'player-role-' + idx);
  PAIRS_ROLES.forEach(function(r) {
    var opt = document.createElement('option');
    opt.value = r.value;
    opt.textContent = r.label;
    opt.selected = player.role === r.value;
    roleSelect.appendChild(opt);
  });
  roleSelect.addEventListener('change', function() {
    allPlayers[idx].role = roleSelect.value;
  });
  header.appendChild(roleSelect);
  panel.appendChild(header);

  var nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Player ' + (idx + 1) + ' name (optional)';
  nameInput.value = player.name;
  nameInput.setAttribute('data-testid', 'player-name-' + idx);
  nameInput.addEventListener('input', function() {
    allPlayers[idx].name = nameInput.value;
  });
  panel.appendChild(nameInput);

  var avatarLabel = document.createElement('p');
  avatarLabel.textContent = 'Pick an avatar:';
  avatarLabel.style.cssText = 'font-weight:normal;font-size:13px;margin:6px 0 4px';
  pairsMakeSpeak(avatarLabel, avatarLabel.textContent);
  panel.appendChild(avatarLabel);

  var grid = document.createElement('div');
  grid.className = 'pairs-avatar-grid';

  animalEntries.forEach(function(entry) {
    var isTaken   = takenIcons.indexOf(entry.id) !== -1;
    var isSelected = player.icon === entry.id;
    var btn = document.createElement('button');
    btn.className = 'pairs-avatar-btn' + PAIRS_SEL[String(isSelected)];
    btn.disabled = isTaken;
    btn.style.opacity = ['0.3', ''][Number(!isTaken)];
    btn.setAttribute('data-testid', 'avatar-' + idx + '-' + entry.id);
    var img = document.createElement('img');
    img.src = pairsImgSrc(entry.id);
    img.alt = [entry.name, entry.id].filter(Boolean)[0];
    btn.appendChild(img);
    pairsMakeSpeak(btn, img.alt);
    btn.addEventListener('click', function() {
      var newPlayers = allPlayers.map(function(p, j) {
        var nameDefault = [p.name, entry.name, entry.id].filter(Boolean)[0];
        var updates = [{ icon: entry.id, name: nameDefault }].filter(function() { return j === idx; });
        return Object.assign.apply(Object, [{}].concat([p], updates));
      });
      onChange({ players: newPlayers });
    });
    grid.appendChild(btn);
  });

  panel.appendChild(grid);
  return panel;
}

function buildSizeSection(gridSize, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'Grid size:';
  pairsMakeSpeak(label, label.textContent);
  section.appendChild(label);
  var sizes = [
    { size: 16, label: '4\u00d74 \u2014 Easy',   speak: '4 by 4, Easy' },
    { size: 36, label: '6\u00d76 \u2014 Medium', speak: '6 by 6, Medium' },
    { size: 64, label: '8\u00d78 \u2014 Hard',   speak: '8 by 8, Hard' }
  ];
  sizes.forEach(function(o) {
    var btn = document.createElement('button');
    btn.textContent = o.label;
    btn.className = 'pairs-size-btn' + PAIRS_SEL[String(gridSize === o.size)];
    btn.setAttribute('data-testid', 'grid-size-' + o.size);
    btn.addEventListener('click', function() { onChange({ gridSize: o.size }); });
    pairsMakeSpeak(btn, o.speak);
    section.appendChild(btn);
  });
  return section;
}

function buildModeSection(mode, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'Screen mode:';
  pairsMakeSpeak(label, label.textContent);
  section.appendChild(label);
  var modes = [{ value: 'shared', label: 'Shared screen' }, { value: 'passplay', label: 'Pass \u0026 Play' }];
  modes.forEach(function(m) {
    var btn = document.createElement('button');
    btn.textContent = m.label;
    btn.className = 'pairs-size-btn' + PAIRS_SEL[String(mode === m.value)];
    btn.setAttribute('data-testid', 'mode-' + m.value);
    btn.addEventListener('click', function() { onChange({ mode: m.value }); });
    pairsMakeSpeak(btn, btn.textContent);
    section.appendChild(btn);
  });
  return section;
}

function buildStartButton(cfg, onStart) {
  var allSet = cfg.players.slice(0, cfg.playerCount).every(function(p) { return p.icon; });
  var btn = document.createElement('button');
  btn.textContent = 'Start Game';
  btn.className = 'pairs-start-btn';
  btn.disabled = !allSet;
  btn.setAttribute('data-testid', 'pairs-start-btn');
  btn.addEventListener('click', onStart);
  pairsMakeSpeak(btn, 'Start Game');
  return btn;
}

// ---- Game ----

// arch: allow-pure-fn
function pairsGameLayoutKey(state, mode) {
  var modeIs2p = state.players.length === 2;
  var keyMap = { passplay: 'passplay', 'true': '2p', 'false': '3p' };
  return [keyMap[mode]].filter(Boolean).concat([keyMap[String(modeIs2p)]])[0];
}

var PAIRS_GAME_RENDERERS = {
  passplay: function(container, state, onFlip) {
    container.appendChild(buildPlayerTraySection(state, state.turnIndex, 'pairs-trays'));
    container.appendChild(buildGrid(state, onFlip));
  },
  '2p': function(container, state, onFlip) {
    container.appendChild(buildPlayerTraySection(state, 1));
    container.appendChild(buildGrid(state, onFlip));
    container.appendChild(buildPlayerTraySection(state, 0, 'pairs-trays'));
  },
  '3p': function(container, state, onFlip) {
    container.appendChild(buildTraysRow(state));
    container.appendChild(buildGrid(state, onFlip));
  }
};

function renderPairsGame(container, state, mode, onFlip) {
  container.innerHTML = '';
  PAIRS_GAME_RENDERERS[pairsGameLayoutKey(state, mode)](container, state, onFlip);
}

function buildPlayerTraySection(state, playerIdx, testId) {
  var p = state.players[playerIdx];
  var wrap = document.createElement('div');
  wrap.className = 'pairs-tray-wrap';
  [testId].filter(Boolean).forEach(function(id) { wrap.setAttribute('data-testid', id); });

  var labelDiv = document.createElement('div');
  labelDiv.className = 'pairs-tray-label' + PAIRS_ACTIVE[String(state.turnIndex === playerIdx)];
  labelDiv.setAttribute('data-testid', 'tray-label-' + p.id);

  [p.icon].filter(Boolean).forEach(function(icon) {
    var iconImg = document.createElement('img');
    iconImg.src = pairsImgSrc(icon);
    iconImg.alt = p.name;
    labelDiv.appendChild(iconImg);
  });

  var nameSpan = document.createElement('span');
  nameSpan.textContent = p.name;
  labelDiv.appendChild(nameSpan);
  wrap.appendChild(labelDiv);
  pairsMakeSpeak(labelDiv, p.name);

  var tray = document.createElement('div');
  tray.className = 'pairs-tray';
  tray.setAttribute('data-testid', 'tray-' + p.id);
  p.pairs.forEach(function(contentId) { tray.appendChild(makeTrayImg(contentId)); });
  wrap.appendChild(tray);

  return wrap;
}

function buildTraysRow(state) {
  var wrap = document.createElement('div');
  wrap.className = 'pairs-trays';
  wrap.setAttribute('data-testid', 'pairs-trays');

  state.players.forEach(function(p, i) {
    var trayWrap = document.createElement('div');
    trayWrap.className = 'pairs-tray-wrap';

    var labelDiv = document.createElement('div');
    labelDiv.className = 'pairs-tray-label' + PAIRS_ACTIVE[String(state.turnIndex === i)];
    labelDiv.setAttribute('data-testid', 'tray-label-' + p.id);

    [p.icon].filter(Boolean).forEach(function(icon) {
      var iconImg = document.createElement('img');
      iconImg.src = pairsImgSrc(icon);
      iconImg.alt = p.name;
      labelDiv.appendChild(iconImg);
    });

    var nameSpan = document.createElement('span');
    nameSpan.textContent = p.name;
    labelDiv.appendChild(nameSpan);
    trayWrap.appendChild(labelDiv);
    pairsMakeSpeak(labelDiv, p.name);

    var tray = document.createElement('div');
    tray.className = 'pairs-tray';
    tray.setAttribute('data-testid', 'tray-' + p.id);
    p.pairs.forEach(function(contentId) { tray.appendChild(makeTrayImg(contentId)); });
    trayWrap.appendChild(tray);
    wrap.appendChild(trayWrap);
  });

  return wrap;
}

function makeTrayImg(contentId) {
  var img = document.createElement('img');
  img.src = pairsImgSrc(contentId);
  img.alt = contentId;
  return img;
}

function buildGrid(state, onFlip) {
  var cols = PAIRS_GRID_COLS[state.gridSize];
  var rows = state.cards.length / cols;
  var grid = document.createElement('div');
  grid.className = 'pairs-grid';
  grid.setAttribute('data-cols', cols);
  grid.setAttribute('data-rows', rows);
  grid.setAttribute('data-testid', 'pairs-grid');

  state.cards.forEach(function(card, idx) {
    var cardEl = buildCardEl(card, idx);
    cardEl.addEventListener('click', function() { onFlip(idx); });
    grid.appendChild(cardEl);
  });

  setTimeout(function() { pairsMeasureCards(grid.parentElement); }, 0);

  return grid;
}

function pairsMeasureCards(container) {
  [container].filter(Boolean)
    .map(function(c) { return c.querySelector('.pairs-grid'); })
    .filter(Boolean)
    .forEach(pairsMeasureGrid);
}

function pairsMeasureGrid(grid) {
  var cols = pairsParseAttr(grid, 'data-cols', 4);
  var rows = pairsParseAttr(grid, 'data-rows', cols);
  var rect = grid.getBoundingClientRect();
  [rect].filter(function(r) { return r.width * r.height > 0; })
    .forEach(function(r) { pairsSetCardSize(grid, cols, rows, r); });
}

// arch: allow-pure-fn
function pairsParseAttr(el, attr, fallback) {
  var v = parseInt(el.getAttribute(attr), 10);
  return [v].filter(function(n) { return n > 0; }).concat([fallback])[0];
}

function pairsSetCardSize(grid, cols, rows, rect) {
  var gap = 5;
  var size = Math.floor(Math.min(
    (rect.width  - (cols - 1) * gap) / cols,
    (rect.height - (rows - 1) * gap) / rows
  ));
  grid.style.setProperty('--card-size', size + 'px');
}

var PAIRS_CARD_CLASS = { revealed: 'face-up', matched: 'matched', hidden: '' };

function buildCardEl(card, idx) {
  var cardEl = document.createElement('div');
  cardEl.className = ['pairs-card', PAIRS_CARD_CLASS[card.state]].filter(Boolean).join(' ');
  cardEl.setAttribute('data-testid', 'card-' + idx);
  cardEl.setAttribute('data-content', card.contentId);

  var inner = document.createElement('div');
  inner.className = 'pairs-card-inner';

  var back = document.createElement('div');
  back.className = 'pairs-card-back';

  var front = document.createElement('div');
  front.className = 'pairs-card-front';
  var img = document.createElement('img');
  img.src = pairsImgSrc(card.contentId);
  img.alt = card.contentId;
  front.appendChild(img);

  inner.appendChild(back);
  inner.appendChild(front);
  cardEl.appendChild(inner);
  return cardEl;
}

// ---- Incremental DOM updates ----

function pairsApplyReveal(container, cardIndex) {
  var el = container.querySelector('[data-testid="card-' + cardIndex + '"]');
  [el].filter(Boolean).forEach(function(e) { e.className = 'pairs-card face-up'; });
}

function pairsApplyMatch(container, cardIndices) {
  cardIndices.forEach(function(i) { pairsSetCardClass(container, i, 'pairs-card matched'); });
}

function pairsApplyMismatch(container, cardIndices) {
  cardIndices.forEach(function(i) { pairsSetCardClass(container, i, 'pairs-card'); });
}

function pairsSetCardClass(container, i, cls) {
  var el = container.querySelector('[data-testid="card-' + i + '"]');
  [el].filter(Boolean).forEach(function(e) { e.className = cls; });
}

function pairsApplyTrayUpdate(container, playerId, contentId) {
  var tray = container.querySelector('[data-testid="tray-' + playerId + '"]');
  [tray].filter(Boolean).forEach(function(t) { t.appendChild(makeTrayImg(contentId)); });
}

function pairsApplyTurnChange(container, players, nextTurnIndex) {
  players.forEach(function(p, i) { pairsUpdateTrayLabel(container, p, i === nextTurnIndex); });
}

function pairsUpdateTrayLabel(container, p, isActive) {
  var label = container.querySelector('[data-testid="tray-label-' + p.id + '"]');
  [label].filter(Boolean).forEach(function(el) {
    el.className = 'pairs-tray-label' + PAIRS_ACTIVE[String(isActive)];
  });
}

function pairsFlashInvalid(container, cardIndex) {
  var el = container.querySelector('[data-testid="card-' + cardIndex + '"]');
  [el].filter(Boolean).forEach(function(e) {
    e.classList.add('flash-invalid');
    e.addEventListener('animationend', function() { e.classList.remove('flash-invalid'); }, { once: true });
  });
}

// ---- Handover ----

function renderPairsHandover(container, playerName, onReady) {
  [container.querySelector('.pairs-handover')].filter(Boolean).forEach(function(e) { e.remove(); });

  var overlay = document.createElement('div');
  overlay.className = 'pairs-handover';
  overlay.setAttribute('data-testid', 'pairs-handover');

  var msg = document.createElement('p');
  msg.className = 'pairs-handover-name';
  msg.textContent = playerName + '\u2019s turn';
  overlay.appendChild(msg);
  pairsMakeSpeak(msg, msg.textContent);
  pairsSpeak(msg.textContent);

  var btn = document.createElement('button');
  btn.textContent = 'Ready';
  btn.className = 'pairs-handover-btn';
  btn.setAttribute('data-testid', 'pairs-handover-ready');
  btn.addEventListener('click', function() { overlay.remove(); onReady(); });
  pairsMakeSpeak(btn, 'Ready');
  overlay.appendChild(btn);

  container.appendChild(overlay);
}

// ---- Summary ----

function renderPairsSummary(container, state, onPlayAgain) {
  container.innerHTML = '';
  var inner = document.createElement('div');
  inner.className = 'pairs-summary-inner';

  var heading = document.createElement('h2');
  heading.textContent = 'All pairs found!';
  inner.appendChild(heading);
  pairsSpeak('All pairs found!');

  state.players.forEach(function(p) {
    var row = document.createElement('div');
    row.className = 'pairs-summary-row';
    row.setAttribute('data-testid', 'summary-row-' + p.id);

    [p.icon].filter(Boolean).forEach(function(icon) {
      var img = document.createElement('img');
      img.src = pairsImgSrc(icon);
      img.alt = p.name;
      row.appendChild(img);
    });

    var text = document.createElement('span');
    text.textContent = p.name + ' \u2014 ' + p.pairs.length + ' pair' + ['s', ''][Number(p.pairs.length === 1)];
    row.appendChild(text);
    pairsMakeSpeak(row, text.textContent);
    inner.appendChild(row);
  });

  var btn = document.createElement('button');
  btn.textContent = 'Play again';
  btn.className = 'pairs-play-again';
  btn.setAttribute('data-testid', 'pairs-play-again');
  btn.addEventListener('click', onPlayAgain);
  pairsMakeSpeak(btn, 'Play again');
  inner.appendChild(btn);

  container.appendChild(inner);
}
