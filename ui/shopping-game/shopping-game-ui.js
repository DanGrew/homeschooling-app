var SHOPPING_SIZES = [
  { size: 16, label: '4\u00d74', speak: '4 by 4' },
  { size: 25, label: '5\u00d75', speak: '5 by 5' },
  { size: 36, label: '6\u00d76', speak: '6 by 6' },
  { size: 49, label: '7\u00d77', speak: '7 by 7' },
  { size: 64, label: '8\u00d78', speak: '8 by 8' }
];

var SHOPPING_FOUND_CLASS = { 'true': ' found', 'false': '' };

// ---- Setup ----

function renderShoppingSetup(container, allEntries, animalEntries, onStart) {
  var availableTags = getAvailableTags(allEntries);
  var cfg = {
    playerCount: 2,
    gridSize: 16,
    mode: 'shared',
    tags: availableTags.slice(),
    players: [
      { name: '', icon: null, role: 'adult' },
      { name: '', icon: null, role: 'adult' },
      { name: '', icon: null, role: 'adult' }
    ]
  };

  function redraw() {
    container.innerHTML = '';
    container.appendChild(buildCgSetupRoot(cfg, SHOPPING_SIZES, availableTags, animalEntries, function(patch) {
      Object.assign(cfg, patch);
      redraw();
    }, function() { onStart(cfg); }));
  }

  redraw();
}

// ---- Shopping tray ----

function buildShoppingTray(state, playerIdx, testId) {
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

  var foundSet = {};
  p.found.forEach(function(id) { foundSet[id] = true; });

  var tray = document.createElement('div');
  tray.className = 'shopping-tray';
  tray.setAttribute('data-testid', 'tray-' + p.id);

  p.list.forEach(function(contentId) {
    var item = document.createElement('div');
    item.className = 'shopping-list-item' + SHOPPING_FOUND_CLASS[String(!!foundSet[contentId])];
    item.setAttribute('data-testid', 'list-item-' + p.id + '-' + contentId);
    var img = document.createElement('img');
    img.src = cgImgSrc(contentId);
    img.alt = contentId;
    item.appendChild(img);
    tray.appendChild(item);
  });

  wrap.appendChild(tray);
  return wrap;
}

// ---- Game ----

var SHOPPING_GAME_RENDERERS = cgMakeGameRenderers(buildShoppingTray);

function renderShoppingGame(container, state, mode, onFlip) {
  container.innerHTML = '';
  SHOPPING_GAME_RENDERERS[cgGameLayoutKey(state, mode)](container, state, onFlip);
}

// ---- Incremental updates ----

function shoppingApplyReveal(container, cardIndex) {
  cgApplyReveal(container, cardIndex);
}

function shoppingApplyFound(container, cardIndex, playerId, contentId) {
  cgApplyFound(container, cardIndex);
  var item = container.querySelector('[data-testid="list-item-' + playerId + '-' + contentId + '"]');
  [item].filter(Boolean).forEach(function(el) { el.className = 'shopping-list-item found'; });
}

function shoppingApplyMismatch(container, cardIndex) {
  cgApplySingleMismatch(container, cardIndex);
}

function shoppingApplyTurnChange(container, players, nextTurnIndex) {
  cgApplyTurnChange(container, players, nextTurnIndex);
}

function shoppingFlashInvalid(container, cardIndex) {
  cgFlashInvalid(container, cardIndex);
}

function shoppingMeasureCards(container) {
  cgMeasureCards(container);
}

// ---- Handover ----

function renderShoppingHandover(container, playerName, onReady) {
  renderCgHandover(container, playerName, onReady);
}

// ---- Summary ----

function renderShoppingSummary(container, state, onPlayAgain) {
  container.innerHTML = '';
  var inner = document.createElement('div');
  inner.className = 'pairs-summary-inner';

  var heading = document.createElement('h2');
  heading.textContent = 'Shopping done!';
  inner.appendChild(heading);
  cgSpeak('Shopping done!');

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
    text.textContent = p.name + ' \u2014 ' + p.found.length + ' / ' + p.list.length + ' found';
    row.appendChild(text);
    cgMakeSpeak(row, text.textContent);
    inner.appendChild(row);
  });

  var btn = document.createElement('button');
  btn.textContent = 'Play again';
  btn.className = 'pairs-play-again';
  btn.setAttribute('data-testid', 'shopping-play-again');
  btn.addEventListener('click', onPlayAgain);
  cgMakeSpeak(btn, 'Play again');
  inner.appendChild(btn);

  container.appendChild(inner);
}
