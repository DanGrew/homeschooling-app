var PAIRS_SIZES = [
  { size: 16, label: '4\u00d74 \u2014 Easy',   speak: '4 by 4, Easy' },
  { size: 36, label: '6\u00d76 \u2014 Medium', speak: '6 by 6, Medium' },
  { size: 64, label: '8\u00d78 \u2014 Hard',   speak: '8 by 8, Hard' }
];

// ---- Setup ----

function renderPairsSetup(container, allEntries, onStart) {
  var availableTags = getAvailableTags(allEntries);
  var cfg = {
    playerCount: 2,
    gridSize: 16,
    mode: 'shared',
    tags: [],
    players: CG_DEFAULT_PLAYERS.map(function(p) { return Object.assign({}, p, { avatarTab: availableTags[0] }); })
  };

  function redraw() {
    cgPreserveScroll(container, function() {
      container.innerHTML = '';
      container.appendChild(buildCgSetupRoot(cfg, PAIRS_SIZES, availableTags, allEntries, function(patch) {
        Object.assign(cfg, patch);
        redraw();
      }, function() { onStart(cfg); }));
    });
  }

  redraw();
}

// ---- Pairs tray ----

function buildPairsTray(state, playerIdx, testId) {
  var p = state.players[playerIdx];
  var wrap = document.createElement('div');
  wrap.className = 'pairs-tray-wrap';
  [testId].filter(Boolean).forEach(function(id) { wrap.setAttribute('data-testid', id); });

  var labelDiv = document.createElement('div');
  labelDiv.className = 'pairs-tray-label' + CG_ACTIVE[String(state.turnIndex === playerIdx)];
  labelDiv.setAttribute('data-testid', 'tray-label-' + p.id);

  [p.icon].filter(Boolean).forEach(function(icon) {
    var iconImg = document.createElement('img');
    iconImg.src = cgImgSrc(icon);
    iconImg.alt = p.name;
    labelDiv.appendChild(iconImg);
  });

  var nameSpan = document.createElement('span');
  nameSpan.textContent = p.name;
  labelDiv.appendChild(nameSpan);
  wrap.appendChild(labelDiv);
  cgMakeSpeak(labelDiv, p.name);

  var tray = document.createElement('div');
  tray.className = 'pairs-tray';
  tray.setAttribute('data-testid', 'tray-' + p.id);
  p.pairs.forEach(function(contentId) { tray.appendChild(cgMakeTrayImg(contentId)); });
  wrap.appendChild(tray);

  return wrap;
}

// ---- Game ----

var PAIRS_GAME_RENDERERS = cgMakeGameRenderers(buildPairsTray);

function renderPairsGame(container, state, mode, onFlip) {
  container.innerHTML = '';
  PAIRS_GAME_RENDERERS[cgGameLayoutKey(state, mode)](container, state, onFlip);
}

// ---- Incremental updates ----

function pairsApplyReveal(container, cardIndex) {
  cgApplyReveal(container, cardIndex);
}

function pairsApplyMatch(container, cardIndices) {
  cgApplyMatch(container, cardIndices);
}

function pairsApplyMismatch(container, cardIndices) {
  cgApplyMismatch(container, cardIndices);
}

function pairsApplyTrayUpdate(container, playerId, contentId) {
  var tray = container.querySelector('[data-testid="tray-' + playerId + '"]');
  [tray].filter(Boolean).forEach(function(t) { t.appendChild(cgMakeTrayImg(contentId)); });
}

function pairsApplyTurnChange(container, players, nextTurnIndex) {
  cgApplyTurnChange(container, players, nextTurnIndex);
}

function pairsFlashInvalid(container, cardIndex) {
  cgFlashInvalid(container, cardIndex);
}

function pairsMeasureCards(container) {
  cgMeasureCards(container);
}

// ---- Handover ----

function renderPairsHandover(container, playerName, onReady) {
  renderCgHandover(container, playerName, onReady);
}

// ---- Summary ----

function renderPairsSummary(container, state, onPlayAgain) {
  container.innerHTML = '';
  var inner = document.createElement('div');
  inner.className = 'pairs-summary-inner';

  var heading = document.createElement('h2');
  heading.textContent = 'All pairs found!';
  inner.appendChild(heading);
  cgSpeak('All pairs found!');

  state.players.forEach(function(p) {
    var row = document.createElement('div');
    row.className = 'pairs-summary-row';
    row.setAttribute('data-testid', 'summary-row-' + p.id);

    [p.icon].filter(Boolean).forEach(function(icon) {
      var img = document.createElement('img');
      img.src = cgImgSrc(icon);
      img.alt = p.name;
      row.appendChild(img);
    });

    var text = document.createElement('span');
    text.textContent = p.name + ' \u2014 ' + p.pairs.length + ' pair' + ['s', ''][Number(p.pairs.length === 1)];
    row.appendChild(text);
    cgMakeSpeak(row, text.textContent);
    inner.appendChild(row);
  });

  var btn = document.createElement('button');
  btn.textContent = 'Play again';
  btn.className = 'pairs-play-again';
  btn.setAttribute('data-testid', 'pairs-play-again');
  btn.addEventListener('click', onPlayAgain);
  cgMakeSpeak(btn, 'Play again');
  inner.appendChild(btn);

  container.appendChild(inner);
}
