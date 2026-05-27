
function buildDominoCountSection(playerCount, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'How many players?';
  cgMakeSpeak(label, label.textContent);
  section.appendChild(label);
  [2, 3].forEach(function(n) {
    var btn = document.createElement('button');
    btn.textContent = n + ' players';
    btn.className = 'pairs-count-btn' + CG_SEL[String(playerCount === n)];
    btn.setAttribute('data-testid', 'player-count-' + n);
    btn.addEventListener('click', function() { onChange({ playerCount: n }); });
    cgMakeSpeak(btn, btn.textContent);
    section.appendChild(btn);
  });
  return section;
}

function buildDominoPlayerPanel(idx, player, avatarEntries, allPlayers, onChange) {
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
    btn.style.opacity = ['1', '0.3'][Number(isTaken)];
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

function buildDominoMatchTypeSection(matchType, matchTypes, onChange) {
  var section = document.createElement('div');
  section.className = 'pairs-setup-section';
  var label = document.createElement('p');
  label.textContent = 'Match type:';
  cgMakeSpeak(label, label.textContent);
  section.appendChild(label);
  matchTypes.forEach(function(m) {
    var btn = document.createElement('button');
    btn.textContent = m.label;
    btn.className = 'pairs-size-btn' + CG_SEL[String(matchType === m.value)];
    btn.setAttribute('data-testid', 'match-type-' + m.value);
    btn.addEventListener('click', function() { onChange({ matchType: m.value }); });
    cgMakeSpeak(btn, btn.textContent);
    section.appendChild(btn);
  });
  return section;
}

function buildDominoStartButton(cfg, onStart) {
  var iconsSet = cfg.players.slice(0, cfg.playerCount).every(function(p) { return p.icon; });
  var btn = document.createElement('button');
  btn.textContent = 'Start Game';
  btn.className = 'pairs-start-btn';
  btn.disabled = !iconsSet;
  btn.setAttribute('data-testid', 'domino-start-btn');
  btn.addEventListener('click', onStart);
  cgMakeSpeak(btn, 'Start Game');
  return btn;
}

function renderDominoSetup(container, allEntries, onStart) {
  var matchTypes = getDominoMatchTypes(allEntries);
  var avatarTags = getAvailableTags(allEntries);
  var cfg = {
    playerCount: 2,
    matchType: 'colours',
    players: CG_DEFAULT_PLAYERS.map(function(p) { return Object.assign({}, p, { avatarTab: avatarTags[0] }); })
  };

  function redraw() {
    cgPreserveScroll(container, function() {
    container.innerHTML = '';
    var root = document.createElement('div');
    root.className = 'pairs-setup-scroll';

    root.appendChild(buildDominoCountSection(cfg.playerCount, function(patch) {
      Object.assign(cfg, patch);
      redraw();
    }));

    cfg.players.slice(0, cfg.playerCount).forEach(function(player, i) {
      root.appendChild(buildDominoPlayerPanel(i, player, allEntries, cfg.players, function(patch) {
        Object.assign(cfg, patch);
        redraw();
      }));
    });

    root.appendChild(buildDominoMatchTypeSection(cfg.matchType, matchTypes, function(patch) {
      Object.assign(cfg, patch);
      redraw();
    }));

    root.appendChild(buildDominoStartButton(cfg, function() {
      var setupState = {
        players: cfg.players.slice(0, cfg.playerCount).map(function(p, i) {
          return {
            name: [p.name, 'Player ' + (i + 1)].filter(Boolean)[0],
            icon: p.icon,
            role: p.role
          };
        }),
        matchType: cfg.matchType
      };
      onStart(setupState);
    }));

    container.appendChild(root);
    });
  }

  redraw();
}
