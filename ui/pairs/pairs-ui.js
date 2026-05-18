var PAIRS_GRID_COLS = { 16: 4, 36: 6, 64: 8 };

var PAIRS_ROLES = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' }
];

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

  for (var i = 0; i < cfg.playerCount; i++) {
    root.appendChild(buildPlayerPanel(i, cfg.players[i], animalEntries, cfg.players, onChange));
  }

  root.appendChild(buildSizeSection(cfg.gridSize, onChange));
  if (cfg.playerCount === 2) root.appendChild(buildModeSection(cfg.mode, onChange));
  root.appendChild(buildStartButton(cfg, onStart));

  return root;
}

function buildCountSection(playerCount, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'How many players?';
  section.appendChild(label);
  [2, 3].forEach(function(n) {
    var btn = document.createElement('button');
    btn.textContent = n + ' players';
    btn.className = 'pairs-count-btn' + (playerCount === n ? ' selected' : '');
    btn.setAttribute('data-testid', 'player-count-' + n);
    btn.addEventListener('click', function() { onChange({ playerCount: n }); });
    section.appendChild(btn);
  });
  return section;
}

function buildPlayerPanel(idx, player, animalEntries, allPlayers, onChange) {
  var takenIcons = allPlayers.map(function(p, i) { return i !== idx ? p.icon : null; }).filter(Boolean);

  var panel = document.createElement('div');
  panel.className = 'pairs-player-panel';
  panel.setAttribute('data-testid', 'player-panel-' + idx);

  var header = document.createElement('div');
  header.className = 'pairs-player-header';

  var label = document.createElement('p');
  label.textContent = 'Player ' + (idx + 1);
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
  panel.appendChild(avatarLabel);

  var grid = document.createElement('div');
  grid.className = 'pairs-avatar-grid';

  animalEntries.forEach(function(entry) {
    var isTaken = takenIcons.indexOf(entry.id) !== -1;
    var isSelected = player.icon === entry.id;
    var btn = document.createElement('button');
    btn.className = 'pairs-avatar-btn' + (isSelected ? ' selected' : '');
    btn.disabled = isTaken;
    btn.style.opacity = isTaken ? '0.3' : '';
    btn.setAttribute('data-testid', 'avatar-' + idx + '-' + entry.id);
    var img = document.createElement('img');
    img.src = pairsImgSrc(entry.id);
    img.alt = entry.name || entry.id;
    btn.appendChild(img);
    btn.addEventListener('click', function() {
      var newPlayers = allPlayers.map(function(p, j) {
        if (j !== idx) return p;
        var name = p.name || (entry.name || entry.id);
        return Object.assign({}, p, { icon: entry.id, name: name });
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
  section.appendChild(label);
  var sizes = [
    { size: 16, label: '4\u00d74 \u2014 Easy' },
    { size: 36, label: '6\u00d76 \u2014 Medium' },
    { size: 64, label: '8\u00d78 \u2014 Hard' }
  ];
  sizes.forEach(function(o) {
    var btn = document.createElement('button');
    btn.textContent = o.label;
    btn.className = 'pairs-size-btn' + (gridSize === o.size ? ' selected' : '');
    btn.setAttribute('data-testid', 'grid-size-' + o.size);
    btn.addEventListener('click', function() { onChange({ gridSize: o.size }); });
    section.appendChild(btn);
  });
  return section;
}

function buildModeSection(mode, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'Screen mode:';
  section.appendChild(label);
  var modes = [{ value: 'shared', label: 'Shared screen' }, { value: 'passplay', label: 'Pass \u0026 Play' }];
  modes.forEach(function(m) {
    var btn = document.createElement('button');
    btn.textContent = m.label;
    btn.className = 'pairs-size-btn' + (mode === m.value ? ' selected' : '');
    btn.setAttribute('data-testid', 'mode-' + m.value);
    btn.addEventListener('click', function() { onChange({ mode: m.value }); });
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
  return btn;
}

// ---- Game ----

function renderPairsGame(container, state, mode, onFlip) {
  container.innerHTML = '';
  var is2Player = state.players.length === 2;

  if (mode === 'passplay') {
    container.appendChild(buildPlayerTraySection(state, state.turnIndex));
    container.appendChild(buildGrid(state, onFlip));
  } else if (is2Player) {
    container.appendChild(buildPlayerTraySection(state, 1));
    container.appendChild(buildGrid(state, onFlip));
    container.appendChild(buildPlayerTraySection(state, 0));
  } else {
    container.appendChild(buildTraysRow(state));
    container.appendChild(buildGrid(state, onFlip));
  }
}

function buildPlayerTraySection(state, playerIdx) {
  var p = state.players[playerIdx];
  var wrap = document.createElement('div');
  wrap.className = 'pairs-tray-wrap';
  wrap.setAttribute('data-testid', 'pairs-trays');

  var labelDiv = document.createElement('div');
  labelDiv.className = 'pairs-tray-label' + (state.turnIndex === playerIdx ? ' active-turn' : '');
  labelDiv.setAttribute('data-testid', 'tray-label-' + p.id);

  if (p.icon) {
    var iconImg = document.createElement('img');
    iconImg.src = pairsImgSrc(p.icon);
    iconImg.alt = p.name;
    labelDiv.appendChild(iconImg);
  }
  var nameSpan = document.createElement('span');
  nameSpan.textContent = p.name;
  labelDiv.appendChild(nameSpan);
  wrap.appendChild(labelDiv);

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
    labelDiv.className = 'pairs-tray-label' + (state.turnIndex === i ? ' active-turn' : '');
    labelDiv.setAttribute('data-testid', 'tray-label-' + p.id);

    if (p.icon) {
      var iconImg = document.createElement('img');
      iconImg.src = pairsImgSrc(p.icon);
      iconImg.alt = p.name;
      labelDiv.appendChild(iconImg);
    }
    var nameSpan = document.createElement('span');
    nameSpan.textContent = p.name;
    labelDiv.appendChild(nameSpan);
    trayWrap.appendChild(labelDiv);

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
  var cols = PAIRS_GRID_COLS[state.gridSize] || 4;
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
  if (!container) return;
  var grid = container.querySelector('.pairs-grid');
  if (!grid) return;
  var cols = parseInt(grid.getAttribute('data-cols'), 10) || 4;
  var rows = parseInt(grid.getAttribute('data-rows'), 10) || cols;
  var rect = grid.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  var gap = 5;
  var size = Math.floor(Math.min(
    (rect.width  - (cols - 1) * gap) / cols,
    (rect.height - (rows - 1) * gap) / rows
  ));
  grid.style.setProperty('--card-size', size + 'px');
}

function buildCardEl(card, idx) {
  var cardEl = document.createElement('div');
  cardEl.className = 'pairs-card' + (card.state !== 'hidden' ? ' ' + PAIRS_CARD_CLASS[card.state] : '');
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

var PAIRS_CARD_CLASS = { revealed: 'face-up', matched: 'matched', hidden: '' };

// ---- Incremental DOM updates ----

function pairsApplyReveal(container, cardIndex) {
  var el = container.querySelector('[data-testid="card-' + cardIndex + '"]');
  if (el) el.className = 'pairs-card face-up';
}

function pairsApplyMatch(container, cardIndices) {
  cardIndices.forEach(function(i) {
    var el = container.querySelector('[data-testid="card-' + i + '"]');
    if (el) el.className = 'pairs-card matched';
  });
}

function pairsApplyMismatch(container, cardIndices) {
  cardIndices.forEach(function(i) {
    var el = container.querySelector('[data-testid="card-' + i + '"]');
    if (el) el.className = 'pairs-card';
  });
}

function pairsApplyTrayUpdate(container, playerId, contentId) {
  var tray = container.querySelector('[data-testid="tray-' + playerId + '"]');
  if (tray) tray.appendChild(makeTrayImg(contentId));
}

function pairsApplyTurnChange(container, players, nextTurnIndex) {
  players.forEach(function(p, i) {
    var label = container.querySelector('[data-testid="tray-label-' + p.id + '"]');
    if (!label) return;
    label.className = 'pairs-tray-label' + (i === nextTurnIndex ? ' active-turn' : '');
  });
}

function pairsFlashInvalid(container, cardIndex) {
  var el = container.querySelector('[data-testid="card-' + cardIndex + '"]');
  if (!el) return;
  el.classList.add('flash-invalid');
  el.addEventListener('animationend', function() { el.classList.remove('flash-invalid'); }, { once: true });
}

// ---- Handover ----

function renderPairsHandover(container, playerName, onReady) {
  var existing = container.querySelector('.pairs-handover');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.className = 'pairs-handover';
  overlay.setAttribute('data-testid', 'pairs-handover');

  var msg = document.createElement('p');
  msg.className = 'pairs-handover-name';
  msg.textContent = playerName + '\u2019s turn';
  overlay.appendChild(msg);

  var btn = document.createElement('button');
  btn.textContent = 'Ready';
  btn.className = 'pairs-handover-btn';
  btn.setAttribute('data-testid', 'pairs-handover-ready');
  btn.addEventListener('click', function() {
    overlay.remove();
    onReady();
  });
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

  state.players.forEach(function(p) {
    var row = document.createElement('div');
    row.className = 'pairs-summary-row';
    row.setAttribute('data-testid', 'summary-row-' + p.id);

    if (p.icon) {
      var img = document.createElement('img');
      img.src = pairsImgSrc(p.icon);
      img.alt = p.name;
      row.appendChild(img);
    }
    var text = document.createElement('span');
    text.textContent = p.name + ' \u2014 ' + p.pairs.length + ' pair' + (p.pairs.length !== 1 ? 's' : '');
    row.appendChild(text);
    inner.appendChild(row);
  });

  var btn = document.createElement('button');
  btn.textContent = 'Play again';
  btn.className = 'pairs-play-again';
  btn.setAttribute('data-testid', 'pairs-play-again');
  btn.addEventListener('click', onPlayAgain);
  inner.appendChild(btn);

  container.appendChild(inner);
}
