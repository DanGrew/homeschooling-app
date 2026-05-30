function renderObjects(svgEl, state) {
  var layer = svgEl.querySelector('[data-layer]');
  var existing = layer.querySelectorAll('[data-obj]');
  existing.forEach(function(el) { el.parentNode.removeChild(el); });

  layer.setAttribute('transform', 'translate(' + (-state.viewport.x) + ',' + (-state.viewport.y) + ')');

  var sorted = state.objects.slice().sort(function(a, b) { return a.zIndex - b.zIndex; });
  sorted.forEach(function(obj) {
    var s = OBJ_SIZE_MAP[obj.size];
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-obj', obj.id);
    g.setAttribute('data-testid', 'object-' + obj.id);
    g.setAttribute('data-shape', obj.shape);
    g.setAttribute('transform',
      'translate(' + obj.x.toFixed(1) + ',' + obj.y.toFixed(1) + ') rotate(' + obj.rotation + ') scale(' + s + ')'
    );
    g.innerHTML = renderObjectShape(obj.shape, obj.colour);
    [obj].filter(function(o) { return o.selected; }).forEach(function() { g.classList.add('obj-selected'); });
    layer.appendChild(g);
  });
}

function renderToolbox(toolboxEl, state) {
  var sel = state.objects.filter(function(o) { return o.selected; });
  var stackHtml = buildStackHTML(state.stackObjects, state.objects);
  toolboxEl.innerHTML = stackHtml + sel.map(buildToolboxHTML).join('');
  toolboxEl.style.display = 'none';
  [state.stackObjects[0]].filter(Boolean).forEach(function() {
    toolboxEl.style.display = 'flex';
  });
}

function renderControls(addBtn, undoBtn, state) {
  var spawnX = state.viewport.x + state.viewport.width / 2;
  var spawnY = state.viewport.y + state.viewport.height / 2;
  addBtn.disabled = !canAddObject(state, spawnX, spawnY);
  undoBtn.style.display = 'none';
  [state.deletedObject].filter(Boolean).forEach(function() { undoBtn.style.display = ''; });
}

var OBJ_SPEAK_PROP = {
  colour: function(o) { return o.colour; },
  shape: function(o) { return o.shape; },
  size: function(o) { return o.size; },
  rotation: function() { return 'rotated'; }
};

function _speak(text) {
  [window.__speakInterrupt].filter(Boolean).forEach(function(fn) { fn(text); });
}

function initObjectPlayground() {
  var wrap = document.getElementById('obj-viewport');
  var svgEl = document.getElementById('obj-world');
  var toolboxEl = document.getElementById('obj-toolbox');
  var addBtn = document.getElementById('obj-add-btn');
  var undoBtn = document.getElementById('obj-undo-btn');
  var w = wrap.clientWidth;
  var h = wrap.clientHeight;
  var state = initObjectState(w, h);

  svgEl.setAttribute('width', state.world.width);
  svgEl.setAttribute('height', state.world.height);

  var layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  layer.setAttribute('data-layer', '');
  svgEl.appendChild(layer);

  function redraw() {
    renderObjects(svgEl, state);
    renderToolbox(toolboxEl, state);
    renderControls(addBtn, undoBtn, state);
  }

  redraw();

  addBtn.addEventListener('click', function() {
    var spawnX = state.viewport.x + state.viewport.width / 2;
    var spawnY = state.viewport.y + state.viewport.height / 2;
    [1].filter(function() { return canAddObject(state, spawnX, spawnY); }).forEach(function() {
      state = addObject(state, spawnX, spawnY);
      redraw();
    });
  });

  undoBtn.addEventListener('click', function() {
    state = restoreDeleted(state);
    redraw();
  });

  var panGesture = { active: false };

  svgEl.addEventListener('pointerdown', function(e) {
    svgEl.setPointerCapture(e.pointerId);
    var tapTarget = e.target.closest('[data-obj]');
    var tapIds = [tapTarget].filter(Boolean).map(function(el) { return el.getAttribute('data-obj'); });
    var svgRect = svgEl.getBoundingClientRect();
    var tapWorldX = e.clientX - svgRect.left + state.viewport.x;
    var tapWorldY = e.clientY - svgRect.top + state.viewport.y;
    panGesture = buildGesture(state, tapIds[0], e.clientX, e.clientY, state.viewport.x, state.viewport.y, tapWorldX, tapWorldY);
  });

  svgEl.addEventListener('pointermove', function(e) {
    var dx = e.clientX - panGesture.startX;
    var dy = e.clientY - panGesture.startY;
    getDragMoves(panGesture, dx, dy).forEach(function(move) {
      panGesture = Object.assign({}, panGesture, { moved: true });
      state = updateDragPosition(state, move.x, move.y);
      toolboxEl.setAttribute('data-dragging', '');
      redraw();
    });
    getPanMoves(panGesture, dx, dy).forEach(function(move) {
      panGesture = Object.assign({}, panGesture, { moved: true });
      state = applyPan(state, move.x, move.y);
      redraw();
    });
  });

  svgEl.addEventListener('pointerup', function() {
    toolboxEl.removeAttribute('data-dragging');
    var gesture = panGesture;
    panGesture = { active: false };
    getTapFlag(gesture).forEach(function() {
      state = handleTap(state, gesture.tapWorldX, gesture.tapWorldY);
      redraw();
      var sel = state.objects.filter(function(o) { return o.selected; });
      sel.slice(0, 1).filter(function() { return sel.length === 1; }).forEach(function(o) { _speak(o.colour + ' ' + o.shape); });
    });
  });

  svgEl.addEventListener('pointercancel', function() {
    toolboxEl.removeAttribute('data-dragging');
    getDragCancelMoves(panGesture).forEach(function(origin) {
      state = updateDragPosition(state, origin.x, origin.y);
      redraw();
    });
    panGesture = { active: false };
  });

  toolboxEl.addEventListener('click', function(e) {
    var propRow = e.target.closest('[data-prop]');
    var pickRow = e.target.closest('[data-pick]');
    var deleteRow = e.target.closest('[data-action="delete"]');
    var gesture = panGesture;
    panGesture = { active: false };
    toolboxEl.removeAttribute('data-dragging');
    [propRow].filter(Boolean).forEach(function(el) {
      var prop = el.getAttribute('data-prop');
      state = applyToolboxClick(state, gesture, prop);
      redraw();
      [state.objects.filter(function(o) { return o.selected; })[0]].filter(Boolean).forEach(function(sel) {
        [OBJ_SPEAK_PROP[prop]].filter(Boolean).forEach(function(fn) { _speak(fn(sel)); });
      });
    });
    [pickRow].filter(Boolean).forEach(function(el) {
      state = applyStackPick(state, el.getAttribute('data-pick'));
      redraw();
      [state.objects.filter(function(o) { return o.selected; })[0]].filter(Boolean).forEach(function(sel) {
        _speak(sel.colour + ' ' + sel.shape);
      });
    });
    [deleteRow].filter(Boolean).forEach(function() {
      var selIds = state.objects.filter(function(o) { return o.selected; }).map(function(o) { return o.id; });
      [selIds[0]].filter(Boolean).forEach(function(id) {
        state = removeObject(state, id);
        redraw();
        _speak('delete');
      });
    });
    var actionRow = e.target.closest('[data-action^="move-"]');
    [actionRow].filter(Boolean).forEach(function(el) {
      var dir = el.getAttribute('data-action').replace('move-', '');
      state = moveSelectedObject(state, dir);
      redraw();
    });
  });
}
