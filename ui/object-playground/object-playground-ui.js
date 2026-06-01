var objAnims = {};

function hasActiveAnims() { return Object.keys(objAnims).length > 0; }

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
    g.setAttribute('transform', objTransform(getVisualPos(obj, objAnims), obj.rotation, s));
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
  var dirLabels = { 'move-left': 'Move left', 'move-right': 'Move right', 'move-up': 'Move up', 'move-down': 'Move down' };
  [window.__makeSpeakable].filter(Boolean).forEach(function(fn) {
    Object.keys(dirLabels).forEach(function(action) {
      toolboxEl.querySelectorAll('[data-action="' + action + '"]').forEach(function(el) {
        fn(el, dirLabels[action]);
      });
    });
  });
}

function renderControls(addBtn, undoBtn, state) {
  var spawnX = state.viewport.x + state.viewport.width / 2;
  var spawnY = state.viewport.y + state.viewport.height / 2;
  addBtn.disabled = !canAddObject(state, spawnX, spawnY);
  undoBtn.style.display = 'none';
  [state.deletedObject].filter(Boolean).forEach(function() { undoBtn.style.display = ''; });
}

var OBJ_DIR_EDGE = { left: 'left edge', right: 'right edge', up: 'top edge', down: 'bottom edge' };

var OBJ_SPEAK_PROP = {
  colour: function(o) { return o.colour; },
  shape: function(o) { return o.shape; },
  size: function(o) { return o.size; },
  rotation: function() { return 'rotated'; }
};

function _speak(text) {
  [window.__speakInterrupt].filter(Boolean).forEach(function(fn) { fn(text); });
}

function _fireGuidance(type) {
  window.dispatchEvent(new CustomEvent('guidance:event', { detail: { type: type } }));
}

var OBJ_DIR_ARROW = { left: '\u2190', right: '\u2192', up: '\u2191', down: '\u2193' };
var OBJ_DIR_OFFSET = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

function _makeArrow(layer, x, y, char, fontSize) {
  var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('class', 'obj-dir-arrow');
  t.setAttribute('data-dir-arrow', '');
  t.setAttribute('x', x);
  t.setAttribute('y', y);
  t.setAttribute('font-size', fontSize);
  t.textContent = char;
  layer.appendChild(t);
  t.addEventListener('animationend', function() { [t.parentNode].filter(Boolean).forEach(function(p) { p.removeChild(t); }); });
}

function showDirArrow(svgEl, obj, dir) {
  var layer = svgEl.querySelector('[data-layer]');
  var scale = OBJ_SIZE_MAP[obj.size];
  var off = OBJ_DIR_OFFSET[dir];
  _makeArrow(layer, obj.x + off[0] * (OBJ_BASE_R * scale + 24), obj.y + off[1] * (OBJ_BASE_R * scale + 24), OBJ_DIR_ARROW[dir], 56);
}

function showRotationIndicator(svgEl, obj) {
  var layer = svgEl.querySelector('[data-layer]');
  var scale = OBJ_SIZE_MAP[obj.size];
  _makeArrow(layer, obj.x, obj.y - OBJ_BASE_R * scale - 20, '\u21BB', 48);
}

function showSizeIndicator(svgEl, obj) {
  var layer = svgEl.querySelector('[data-layer]');
  var scale = OBJ_SIZE_MAP[obj.size];
  var off = OBJ_BASE_R * scale + 16;
  ['\u2191', '\u2193', '\u2190', '\u2192'].forEach(function(ch, i) {
    var dx = [0, 0, -1, 1][i] * off;
    var dy = [-1, 1, 0, 0][i] * off;
    _makeArrow(layer, obj.x + dx, obj.y + dy, ch, 36);
  });
}

function showEdgeFlash(svgEl, objId) {
  var el = svgEl.querySelector('[data-obj="' + objId + '"]');
  [el].filter(Boolean).forEach(function(el) {
    el.classList.add('obj-edge-flash');
    el.addEventListener('animationend', function() { el.classList.remove('obj-edge-flash'); }, { once: true });
  });
}

function _applyLocks(toolboxEl, addBtn, undoBtn, locks) {
  if (locks.colour) toolboxEl.querySelectorAll('[data-prop="colour"]').forEach(function(el) { el.style.display = 'none'; });
  if (locks.size) toolboxEl.querySelectorAll('[data-prop="size"]').forEach(function(el) { el.style.display = 'none'; });
  if (locks.shape) toolboxEl.querySelectorAll('[data-prop="shape"]').forEach(function(el) { el.style.display = 'none'; });
  if (locks.rotation) toolboxEl.querySelectorAll('[data-prop="rotation"]').forEach(function(el) { el.style.display = 'none'; });
  if (locks.direction) {
    ['move-left', 'move-right', 'move-up', 'move-down'].forEach(function(action) {
      toolboxEl.querySelectorAll('[data-action="' + action + '"]').forEach(function(el) { el.style.display = 'none'; });
    });
  }
  if (locks.addRemove) {
    addBtn.disabled = true;
    undoBtn.style.display = 'none';
  }
}

function _fireCountEvents(count) {
  [1, 2, 3, 4, 5].filter(function(n) { return n === count; }).forEach(function(n) {
    _fireGuidance('OBJECT_COUNT_' + n);
  });
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
  var objLocks = {};

  svgEl.setAttribute('width', state.world.width);
  svgEl.setAttribute('height', state.world.height);

  var layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  layer.setAttribute('data-layer', '');
  svgEl.appendChild(layer);

  var animRafHandle = null;

  function tickAnims() {
    Object.keys(objAnims).forEach(function(id) {
      state.objects.filter(function(o) { return o.id === id; }).forEach(function(obj) {
        var pos = getVisualPos(obj, objAnims);
        var el = svgEl.querySelector('[data-obj="' + id + '"]');
        [el].filter(Boolean).forEach(function(el) {
          el.setAttribute('transform', objTransform(pos, obj.rotation, OBJ_SIZE_MAP[obj.size]));
        });
      });
    });
  }

  function scheduleAnimLoop() {
    [animRafHandle].filter(Boolean).forEach(function(h) { cancelAnimationFrame(h); });
    [1].filter(hasActiveAnims).forEach(function() {
      animRafHandle = requestAnimationFrame(function() {
        animRafHandle = null;
        tickAnims();
        scheduleAnimLoop();
      });
    });
  }

  function redraw() {
    renderObjects(svgEl, state);
    renderToolbox(toolboxEl, state);
    _applyLocks(toolboxEl, addBtn, undoBtn, objLocks);
    renderControls(addBtn, undoBtn, state);
    if (objLocks.addRemove) { addBtn.disabled = true; undoBtn.style.display = 'none'; }
  }

  redraw();

  addBtn.addEventListener('click', function() {
    if (objLocks.addRemove) return;
    var spawnX = state.viewport.x + state.viewport.width / 2;
    var spawnY = state.viewport.y + state.viewport.height / 2;
    [1].filter(function() { return canAddObject(state, spawnX, spawnY); }).forEach(function() {
      state = addObject(state, spawnX, spawnY);
      redraw();
      _fireGuidance('OBJECT_ADDED');
      _fireCountEvents(state.objects.length);
    });
  });

  undoBtn.addEventListener('click', function() {
    if (objLocks.addRemove) return;
    state = restoreDeleted(state);
    redraw();
  });

  var panGesture = { active: false };

  svgEl.addEventListener('pointerdown', function(e) {
    svgEl.setPointerCapture(e.pointerId);
    var tapTarget = e.target.closest('[data-obj]');
    var tapIds = [tapTarget].filter(Boolean).map(function(el) { return el.getAttribute('data-obj'); });
    tapIds.forEach(function(id) { delete objAnims[id]; });
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
    [gesture].filter(function(g) { return g.moved && g.isSelected; }).forEach(function() {
      _fireGuidance('OBJECT_DRAGGED');
    });
    getTapFlag(gesture).forEach(function() {
      state = handleTap(state, gesture.tapWorldX, gesture.tapWorldY);
      redraw();
      var sel = state.objects.filter(function(o) { return o.selected; });
      sel.slice(0, 1).filter(function() { return sel.length === 1; }).forEach(function(o) {
        _speak(o.colour + ' ' + o.shape);
        _fireGuidance('OBJECT_SELECTED');
        _fireGuidance('TAPPED_OBJECT_COLOUR_' + o.colour.toUpperCase());
        _fireGuidance('TAPPED_OBJECT_SHAPE_' + o.shape.toUpperCase());
      });
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
      var sel = state.objects.filter(function(o) { return o.selected; })[0];
      [OBJ_SPEAK_PROP[prop]].filter(Boolean).forEach(function(fn) { _speak(fn(sel)); });
      [sel].filter(function(o) { return o && prop === 'rotation'; }).forEach(function(o) {
        showRotationIndicator(svgEl, o);
        _fireGuidance('OBJECT_ROTATED');
      });
      [sel].filter(function(o) { return o && prop === 'size'; }).forEach(function(o) {
        showSizeIndicator(svgEl, o);
        _fireGuidance('SIZE_CHANGED');
        [o].filter(function(o) { return o.size === OBJ_SIZES[OBJ_SIZES.length - 1]; }).forEach(function() { _fireGuidance('SIZE_AT_MAX'); });
        [o].filter(function(o) { return o.size === OBJ_SIZES[0]; }).forEach(function() { _fireGuidance('SIZE_AT_MIN'); });
      });
      [sel].filter(function(o) { return o && prop === 'colour'; }).forEach(function(o) {
        _fireGuidance('COLOUR_CHANGED');
        _fireGuidance('COLOUR_CHANGED_' + o.colour.toUpperCase());
      });
      [sel].filter(function(o) { return o && prop === 'shape'; }).forEach(function(o) {
        _fireGuidance('SHAPE_CHANGED');
        _fireGuidance('SHAPE_CHANGED_' + o.shape.toUpperCase());
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
      if (objLocks.addRemove) return;
      var selIds = state.objects.filter(function(o) { return o.selected; }).map(function(o) { return o.id; });
      [selIds[0]].filter(Boolean).forEach(function(id) {
        state = removeObject(state, id);
        redraw();
        _speak('delete');
        _fireGuidance('OBJECT_REMOVED');
        _fireCountEvents(state.objects.length);
      });
    });
    var actionRow = e.target.closest('[data-action^="move-"]');
    var flashIds = [];
    [actionRow].filter(Boolean).filter(function() { return !objLocks.direction; }).forEach(function(el) {
      var dir = el.getAttribute('data-action').replace('move-', '');
      var sel = state.objects.filter(function(o) { return o.selected; })[0];
      var animFrom = [sel].filter(Boolean).map(function(s) { return getVisualPos(s, objAnims); })[0];
      var logicalFrom = [sel].filter(Boolean).map(function(s) { return { x: s.x, y: s.y }; })[0];
      state = moveSelectedObject(state, dir);
      var afterSel = state.objects.filter(function(o) { return o.selected; })[0];
      [afterSel].filter(Boolean).forEach(function(o) {
        var unchanged = [logicalFrom].filter(function(p) { return p.x === o.x; }).filter(function(p) { return p.y === o.y; });
        [o].filter(function() { return animFrom; }).filter(function() { return !unchanged.length; }).forEach(function(o) {
          objAnims[o.id] = { fromX: animFrom.x, fromY: animFrom.y, toX: o.x, toY: o.y, startTime: Date.now() };
          _speak('move ' + dir);
          showDirArrow(svgEl, o, dir);
          _fireGuidance('MOVED_' + dir.toUpperCase());
        });
        [o].filter(function() { return logicalFrom; }).filter(function() { return unchanged.length; }).forEach(function(o) {
          _speak(OBJ_DIR_EDGE[dir]);
          flashIds.push(o.id);
        });
      });
      redraw();
      scheduleAnimLoop();
      flashIds.forEach(function(id) { showEdgeFlash(svgEl, id); });
    });
  });

  window.addEventListener('page:control', function(e) {
    var type = e.detail.type;
    var LOCK_CTRL = {
      'LOCK_COLOUR_CONTROLS':  function() { objLocks.colour = true; },
      'LOCK_SIZE_CONTROLS':    function() { objLocks.size = true; },
      'LOCK_SHAPE_CONTROLS':   function() { objLocks.shape = true; },
      'LOCK_ADD_REMOVE':       function() { objLocks.addRemove = true; },
      'LOCK_DIRECTION_BUTTONS':function() { objLocks.direction = true; },
      'LOCK_ROTATION':         function() { objLocks.rotation = true; },
      'UNLOCK_ALL':            function() { objLocks = {}; },
      'PAGE_CONTROL_RESET':    function() { objLocks = {}; },
      'CLEAR_CANVAS':          function() {
        state = Object.assign({}, state, { objects: [], stackObjects: [], deletedObject: null });
      }
    };
    [LOCK_CTRL[type]].filter(Boolean).forEach(function(fn) { fn(); });
    redraw();
  });
}
