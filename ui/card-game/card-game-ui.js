var CG_SEL    = { 'true': ' selected', 'false': '' };
var CG_ACTIVE = { 'true': ' active-turn', 'false': '' };
var CG_NOOP   = function() {};

var CG_ROLES = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' }
];

var CG_DEFAULT_PLAYERS = [
  { name: '', icon: null, role: 'child' },
  { name: '', icon: null, role: 'adult' },
  { name: '', icon: null, role: 'adult' }
];

function cgSpeak(text) {
  [window.__speakInterrupt].filter(Boolean).forEach(function(fn) { fn(text); });
}
function cgMakeSpeak(el, text) {
  el.classList.add('speakable');
  el.setAttribute('data-speak', text);
  [window.__makeSpeakable].filter(Boolean).forEach(function(fn) { fn(el, text); });
}

function cgImgSrc(id) {
  return [window.ImageService].filter(Boolean).map(function(s){return s.getUrl(id);}).filter(Boolean).concat([window.DICT_BASE+id+'/'+id+'.svg'])[0];
}

// ---- Setup shared sections ----

function cgPreserveScroll(container, fn) {
  var scrollTop = 0;
  [container.querySelector('.pairs-setup-scroll')].filter(Boolean).forEach(function(el) { scrollTop = el.scrollTop; });
  fn();
  [container.querySelector('.pairs-setup-scroll')].filter(Boolean).forEach(function(el) { el.scrollTop = scrollTop; });
}

function buildCgCountSection(playerCount, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'How many players?';
  cgMakeSpeak(label, label.textContent);
  section.appendChild(label);
  var COUNT_LABEL = { 1: '1 player', 2: '2 players', 3: '3 players' };
  [1, 2, 3].forEach(function(n) {
    var btn = document.createElement('button');
    btn.textContent = COUNT_LABEL[n];
    btn.className = 'pairs-count-btn' + CG_SEL[String(playerCount === n)];
    btn.setAttribute('data-testid', 'player-count-' + n);
    btn.addEventListener('click', function() { onChange({ playerCount: n }); });
    cgMakeSpeak(btn, btn.textContent);
    section.appendChild(btn);
  });
  return section;
}

function buildCgPlayerPanel(idx, player, avatarEntries, allPlayers, onChange) {
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
  cgMakeSpeak(label, label.textContent);
  header.appendChild(label);

  var roleSelect = document.createElement('select');
  roleSelect.className = 'pairs-role-select';
  roleSelect.setAttribute('data-testid', 'player-role-' + idx);
  CG_ROLES.forEach(function(r) {
    var opt = document.createElement('option');
    opt.value = r.value;
    opt.textContent = r.label;
    opt.selected = player.role === r.value;
    roleSelect.appendChild(opt);
  });
  roleSelect.addEventListener('change', function() { allPlayers[idx].role = roleSelect.value; });
  header.appendChild(roleSelect);
  panel.appendChild(header);

  var nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Player ' + (idx + 1) + ' name (optional)';
  nameInput.value = player.name;
  nameInput.setAttribute('data-testid', 'player-name-' + idx);
  nameInput.addEventListener('input', function() { allPlayers[idx].name = nameInput.value; });
  panel.appendChild(nameInput);

  var avatarLabel = document.createElement('p');
  avatarLabel.textContent = 'Pick an avatar:';
  avatarLabel.style.cssText = 'font-weight:normal;font-size:13px;margin:6px 0 4px';
  cgMakeSpeak(avatarLabel, avatarLabel.textContent);
  panel.appendChild(avatarLabel);

  var avatarTags = getAvailableTags(avatarEntries);
  var currentTab = [player.avatarTab].concat(avatarTags).filter(Boolean)[0];
  var tabRow = document.createElement('div');
  tabRow.className = 'pairs-setup-section';
  avatarTags.forEach(function(tag) {
    var tabBtn = document.createElement('button');
    tabBtn.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
    tabBtn.className = 'pairs-size-btn' + CG_SEL[String(currentTab === tag)];
    tabBtn.setAttribute('data-testid', 'avatar-tab-' + idx + '-' + tag);
    tabBtn.addEventListener('click', function() {
      var newPlayers = allPlayers.map(function(p, j) {
        var updates = [{ avatarTab: tag }].filter(function() { return j === idx; });
        return Object.assign.apply(Object, [{}].concat([p], updates));
      });
      onChange({ players: newPlayers });
    });
    cgMakeSpeak(tabBtn, tabBtn.textContent);
    tabRow.appendChild(tabBtn);
  });
  panel.appendChild(tabRow);

  var grid = document.createElement('div');
  grid.className = 'pairs-avatar-grid';

  filterByTag(avatarEntries, currentTab).forEach(function(entry) {
    var isTaken    = takenIcons.indexOf(entry.id) !== -1;
    var isSelected = player.icon === entry.id;
    var btn = document.createElement('button');
    btn.className = 'pairs-avatar-btn' + CG_SEL[String(isSelected)];
    btn.disabled = isTaken;
    btn.style.opacity = ['0.3', ''][Number(!isTaken)];
    btn.setAttribute('data-testid', 'avatar-' + idx + '-' + entry.id);
    var img = document.createElement('img');
    img.src = cgImgSrc(entry.id);
    img.alt = [entry.name, entry.id].filter(Boolean)[0];
    btn.appendChild(img);
    cgMakeSpeak(btn, img.alt);
    btn.addEventListener('click', function() {
      var newPlayers = allPlayers.map(function(p, j) {
        var nameDefault = [entry.name, entry.id].filter(Boolean)[0];
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

function buildCgTagSection(availableTags, selectedTags, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'Content:';
  cgMakeSpeak(label, label.textContent);
  section.appendChild(label);

  availableTags.forEach(function(tag) {
    var isSelected = selectedTags.indexOf(tag) !== -1;
    var btn = document.createElement('button');
    btn.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
    btn.className = 'pairs-size-btn' + CG_SEL[String(isSelected)];
    btn.setAttribute('data-testid', 'tag-' + tag);
    btn.addEventListener('click', function() {
      var wasSelected = selectedTags.indexOf(tag) !== -1;
      var removed = selectedTags.filter(function(t) { return t !== tag; });
      var added = selectedTags.concat([tag]);
      onChange({ tags: [removed, added][Number(!wasSelected)] });
    });
    cgMakeSpeak(btn, btn.textContent);
    section.appendChild(btn);
  });

  return section;
}

function buildCgSizeSection(sizes, selectedSize, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'Grid size:';
  cgMakeSpeak(label, label.textContent);
  section.appendChild(label);
  sizes.forEach(function(o) {
    var btn = document.createElement('button');
    btn.textContent = o.label;
    btn.className = 'pairs-size-btn' + CG_SEL[String(selectedSize === o.size)];
    btn.setAttribute('data-testid', 'grid-size-' + o.size);
    btn.addEventListener('click', function() { onChange({ gridSize: o.size }); });
    cgMakeSpeak(btn, [o.speak, o.label].filter(Boolean)[0]);
    section.appendChild(btn);
  });
  return section;
}

function buildCgModeSection(mode, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'Screen mode:';
  cgMakeSpeak(label, label.textContent);
  section.appendChild(label);
  var modes = [{ value: 'shared', label: 'Shared screen' }, { value: 'passplay', label: 'Pass \u0026 Play' }];
  modes.forEach(function(m) {
    var btn = document.createElement('button');
    btn.textContent = m.label;
    btn.className = 'pairs-size-btn' + CG_SEL[String(mode === m.value)];
    btn.setAttribute('data-testid', 'mode-' + m.value);
    btn.addEventListener('click', function() { onChange({ mode: m.value }); });
    cgMakeSpeak(btn, btn.textContent);
    section.appendChild(btn);
  });
  return section;
}

function buildCgStartButton(cfg, onStart) {
  var iconsSet = cfg.players.slice(0, cfg.playerCount).every(function(p) { return p.icon; });
  var tagsOk   = cfg.tags.length > 0;
  var allSet   = Number(iconsSet) & Number(tagsOk);
  var btn = document.createElement('button');
  btn.textContent = 'Start Game';
  btn.className = 'pairs-start-btn';
  btn.disabled = !allSet;
  btn.setAttribute('data-testid', 'pairs-start-btn');
  btn.addEventListener('click', onStart);
  cgMakeSpeak(btn, 'Start Game');
  return btn;
}

function buildCgSetupRoot(cfg, sizeDefs, availableTags, avatarEntries, onChange, onStart) {
  var root = document.createElement('div');
  root.className = 'pairs-setup-scroll';

  root.appendChild(buildCgCountSection(cfg.playerCount, onChange));

  cfg.players.slice(0, cfg.playerCount).forEach(function(player, i) {
    root.appendChild(buildCgPlayerPanel(i, player, avatarEntries, cfg.players, onChange));
  });

  root.appendChild(buildCgTagSection(availableTags, cfg.tags, onChange));
  root.appendChild(buildCgSizeSection(sizeDefs, cfg.gridSize, onChange));

  [buildCgModeSection(cfg.mode, onChange)]
    .filter(function() { return cfg.playerCount === 2; })
    .forEach(function(el) { root.appendChild(el); });

  root.appendChild(buildCgStartButton(cfg, onStart));
  return root;
}

// ---- Grid & Cards ----

var CG_CARD_CLASS = { revealed: 'face-up', matched: 'matched', found: 'found', hidden: '' };

function buildCgCardEl(card, idx) {
  var cardEl = document.createElement('div');
  cardEl.className = ['pairs-card', CG_CARD_CLASS[card.state]].filter(Boolean).join(' ');
  cardEl.setAttribute('data-testid', 'card-' + idx);
  cardEl.setAttribute('data-content', card.contentId);

  var inner = document.createElement('div');
  inner.className = 'pairs-card-inner';

  var back = document.createElement('div');
  back.className = 'pairs-card-back';

  var front = document.createElement('div');
  front.className = 'pairs-card-front';
  var img = document.createElement('img');
  img.src = cgImgSrc(card.contentId);
  img.alt = card.contentId;
  front.appendChild(img);

  inner.appendChild(back);
  inner.appendChild(front);
  cardEl.appendChild(inner);
  return cardEl;
}

function cgSetCardSize(grid, cols, rows, rect) {
  var gap  = 5;
  var hPad = 16;
  var vPad = 12;
  var size = Math.floor(Math.min(
    (rect.width  - hPad - (cols - 1) * gap) / cols,
    (rect.height - vPad - (rows - 1) * gap) / rows
  ));
  grid.style.setProperty('--card-size', size + 'px');
}

function cgMeasureGrid(grid) {
  var colsRaw = parseInt(grid.getAttribute('data-cols'), 10);
  var rowsRaw = parseInt(grid.getAttribute('data-rows'), 10);
  var cols = [colsRaw].filter(function(n) { return n > 0; }).concat([4])[0];
  var rows = [rowsRaw].filter(function(n) { return n > 0; }).concat([cols])[0];
  var rect = grid.getBoundingClientRect();
  [rect].filter(function(r) { return r.width * r.height > 0; })
    .forEach(function(r) { cgSetCardSize(grid, cols, rows, r); });
}

function cgMeasureCards(container) {
  [container].filter(Boolean)
    .map(function(c) { return c.querySelector('.pairs-grid'); })
    .filter(Boolean)
    .forEach(cgMeasureGrid);
}

function buildCgGrid(state, onFlip) {
  var cols = Math.round(Math.sqrt(state.gridSize));
  var rows = state.cards.length / cols;
  var grid = document.createElement('div');
  grid.className = 'pairs-grid';
  grid.setAttribute('data-cols', cols);
  grid.setAttribute('data-rows', rows);
  grid.setAttribute('data-testid', 'pairs-grid');

  state.cards.forEach(function(card, idx) {
    var cardEl = buildCgCardEl(card, idx);
    cardEl.addEventListener('click', function() { onFlip(idx); });
    grid.appendChild(cardEl);
  });

  setTimeout(function() { cgMeasureCards(grid.parentElement); }, 0);
  return grid;
}

// ---- Incremental DOM updates ----

function cgSetCardClass(container, i, cls) {
  var el = container.querySelector('[data-testid="card-' + i + '"]');
  [el].filter(Boolean).forEach(function(e) { e.className = cls; });
}

function cgApplyReveal(container, cardIndex) {
  cgSetCardClass(container, cardIndex, 'pairs-card face-up');
}

function cgApplyMatch(container, cardIndices) {
  cardIndices.forEach(function(i) { cgSetCardClass(container, i, 'pairs-card matched'); });
}

function cgApplyFound(container, cardIndex) {
  cgSetCardClass(container, cardIndex, 'pairs-card found');
}

function cgApplyMismatch(container, cardIndices) {
  cardIndices.forEach(function(i) { cgSetCardClass(container, i, 'pairs-card'); });
}

function cgApplySingleMismatch(container, cardIndex) {
  cgSetCardClass(container, cardIndex, 'pairs-card');
}

function cgUpdateTrayLabel(container, p, isActive) {
  var label = container.querySelector('[data-testid="tray-label-' + p.id + '"]');
  [label].filter(Boolean).forEach(function(el) {
    el.className = 'pairs-tray-label' + CG_ACTIVE[String(isActive)];
  });
}

function cgApplyTurnChange(container, players, nextTurnIndex) {
  players.forEach(function(p, i) { cgUpdateTrayLabel(container, p, i === nextTurnIndex); });
}

function cgFlashInvalid(container, cardIndex) {
  var el = container.querySelector('[data-testid="card-' + cardIndex + '"]');
  [el].filter(Boolean).forEach(function(e) {
    e.classList.add('flash-invalid');
    e.addEventListener('animationend', function() { e.classList.remove('flash-invalid'); }, { once: true });
  });
}

function cgMakeTrayImg(contentId) {
  var img = document.createElement('img');
  img.src = cgImgSrc(contentId);
  img.alt = contentId;
  return img;
}

// ---- Handover overlay ----

function renderCgHandover(container, playerName, onReady) {
  [container.querySelector('.pairs-handover')].filter(Boolean).forEach(function(e) { e.remove(); });

  var overlay = document.createElement('div');
  overlay.className = 'pairs-handover';
  overlay.setAttribute('data-testid', 'pairs-handover');

  var msg = document.createElement('p');
  msg.className = 'pairs-handover-name';
  msg.textContent = playerName + '\u2019s turn';
  overlay.appendChild(msg);
  cgMakeSpeak(msg, msg.textContent);
  cgSpeak(msg.textContent);

  var btn = document.createElement('button');
  btn.textContent = 'Ready';
  btn.className = 'pairs-handover-btn';
  btn.setAttribute('data-testid', 'pairs-handover-ready');
  btn.addEventListener('click', function() { overlay.remove(); onReady(); });
  cgMakeSpeak(btn, 'Ready');
  overlay.appendChild(btn);

  container.appendChild(overlay);
}

// ---- Layout helpers ----

function buildCgTraysRow(state, buildTray) {
  var wrap = document.createElement('div');
  wrap.className = 'pairs-trays';
  wrap.setAttribute('data-testid', 'pairs-trays');
  state.players.forEach(function(p, i) { wrap.appendChild(buildTray(state, i)); });
  return wrap;
}

function cgMakeGameRenderers(buildTray) {
  return {
    '1p': function(container, state, onFlip) {
      container.appendChild(buildCgGrid(state, onFlip));
      container.appendChild(buildTray(state, 0, 'pairs-trays'));
    },
    passplay: function(container, state, onFlip) {
      container.appendChild(buildTray(state, state.turnIndex, 'pairs-trays'));
      container.appendChild(buildCgGrid(state, onFlip));
    },
    '2p': function(container, state, onFlip) {
      container.appendChild(buildTray(state, 1));
      container.appendChild(buildCgGrid(state, onFlip));
      container.appendChild(buildTray(state, 0, 'pairs-trays'));
    },
    '3p': function(container, state, onFlip) {
      container.appendChild(buildCgTraysRow(state, buildTray));
      container.appendChild(buildCgGrid(state, onFlip));
    }
  };
}
