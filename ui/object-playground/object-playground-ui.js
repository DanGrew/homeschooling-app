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
  addBtn.disabled = !canAddObject(state);
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
  [locks.colour].filter(Boolean).forEach(function() { toolboxEl.querySelectorAll('[data-prop="colour"]').forEach(function(el) { el.style.display = 'none'; }); });
  [locks.size].filter(Boolean).forEach(function() { toolboxEl.querySelectorAll('[data-prop="size"]').forEach(function(el) { el.style.display = 'none'; }); });
  [locks.shape].filter(Boolean).forEach(function() { toolboxEl.querySelectorAll('[data-prop="shape"]').forEach(function(el) { el.style.display = 'none'; }); });
  [locks.rotation].filter(Boolean).forEach(function() { toolboxEl.querySelectorAll('[data-prop="rotation"]').forEach(function(el) { el.style.display = 'none'; }); });
  [locks.direction].filter(Boolean).forEach(function() {
    ['move-left', 'move-right', 'move-up', 'move-down'].forEach(function(action) {
      toolboxEl.querySelectorAll('[data-action="' + action + '"]').forEach(function(el) { el.style.display = 'none'; });
    });
  });
  [locks.addRemove].filter(Boolean).forEach(function() { addBtn.disabled = true; undoBtn.style.display = 'none'; });
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
  var lastSelectedId = null;
  var _spawnPositions = [[0.5,0.5],[0.25,0.35],[0.75,0.35],[0.25,0.65],[0.75,0.65],[0.5,0.2],[0.5,0.8],[0.1,0.5],[0.9,0.5]];
  var _spawnIndex = 0;

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
    [objLocks.addRemove].filter(Boolean).forEach(function() { addBtn.disabled = true; undoBtn.style.display = 'none'; });
  }

  redraw();

  addBtn.addEventListener('click', function() {
    [1].filter(function() { return !objLocks.addRemove; }).forEach(function() {
      var pos = _spawnPositions[_spawnIndex % _spawnPositions.length];
      _spawnIndex++;
      var spawnX = state.viewport.x + state.viewport.width * pos[0];
      var spawnY = state.viewport.y + state.viewport.height * pos[1];
      [1].filter(function() { return canAddObject(state); }).forEach(function() {
        state = addObject(state, spawnX, spawnY);
        redraw();
        _fireGuidance('OBJECT_ADDED');
        _fireCountEvents(state.objects.length);
      });
    });
  });

  undoBtn.addEventListener('click', function() {
    [1].filter(function() { return !objLocks.addRemove; }).forEach(function() {
      state = restoreDeleted(state);
      redraw();
    });
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
    [gesture].filter(function(g) { return g.moved; }).filter(function(g) { return g.isSelected; }).forEach(function() {
      _fireGuidance('OBJECT_DRAGGED');
    });
    getTapFlag(gesture).forEach(function() {
      state = handleTap(state, gesture.tapWorldX, gesture.tapWorldY);
      redraw();
      var sel = state.objects.filter(function(o) { return o.selected; });
      sel.slice(0, 1).filter(function() { return sel.length === 1; }).forEach(function(o) {
        _speak(o.colour + ' ' + o.shape);
        _fireGuidance('OBJECT_SELECTED');
        [lastSelectedId].filter(Boolean).filter(function(id) { return id !== o.id; }).forEach(function() { _fireGuidance('DIFFERENT_OBJECT_SELECTED'); });
        lastSelectedId = o.id;
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
      [sel].filter(Boolean).filter(function() { return prop === 'rotation'; }).forEach(function(o) {
        showRotationIndicator(svgEl, o);
        _fireGuidance('OBJECT_ROTATED');
      });
      [sel].filter(Boolean).filter(function() { return prop === 'size'; }).forEach(function(o) {
        showSizeIndicator(svgEl, o);
        _fireGuidance('SIZE_CHANGED');
        [o].filter(function(o) { return o.size === OBJ_SIZES[OBJ_SIZES.length - 1]; }).forEach(function() { _fireGuidance('SIZE_AT_MAX'); });
        [o].filter(function(o) { return o.size === OBJ_SIZES[0]; }).forEach(function() { _fireGuidance('SIZE_AT_MIN'); });
      });
      [sel].filter(Boolean).filter(function() { return prop === 'colour'; }).forEach(function(o) {
        _fireGuidance('COLOUR_CHANGED');
        _fireGuidance('COLOUR_CHANGED_' + o.colour.toUpperCase());
      });
      [sel].filter(Boolean).filter(function() { return prop === 'shape'; }).forEach(function(o) {
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
      _fireGuidance('STACK_PICKED');
    });
    [deleteRow].filter(Boolean).filter(function() { return !objLocks.addRemove; }).forEach(function() {
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

  function _placeSelectionObjects(objects) {
    state = Object.assign({}, state, { objects: objects, stackObjects: [], deletedObject: null });
    objLocks = { addRemove: true, direction: true, rotation: true, size: true, shape: true, colour: true };
  }

  function _shuffleObjectPositions() {
    var objs = state.objects.slice();
    var positions = objs.map(function(o) { return { x: o.x, y: o.y }; });
    positions.slice(1).map(function(_, k) { return positions.length - 1 - k; })
      .forEach(function(i) { var j = Math.floor(Math.random() * (i + 1)); var tmp = positions[i]; positions[i] = positions[j]; positions[j] = tmp; });
    state = Object.assign({}, state, {
      objects: objs.map(function(o, i) { return Object.assign({}, o, { x: positions[i].x, y: positions[i].y }); }),
      stackObjects: []
    });
  }

  function _buildColourSelectionObjects() {
    var vx = state.viewport.x, vy = state.viewport.y;
    var vw = state.viewport.width, vh = state.viewport.height;
    var xs = [vx + vw * 0.2, vx + vw * 0.5, vx + vw * 0.8];
    var ys = [vy + vh * 0.35, vy + vh * 0.7];
    return OBJ_COLOURS.map(function(colour, i) {
      return { id: 'sel-' + i, shape: 'circle', colour: colour, size: 'medium',
               rotation: 0, x: xs[i % 3], y: ys[Math.floor(i / 3)], selected: false, zIndex: i };
    });
  }

  function _buildShapeSelectionObjects() {
    var vx = state.viewport.x, vy = state.viewport.y;
    var vw = state.viewport.width, vh = state.viewport.height;
    var xsTop = [vx + vw*0.15, vx + vw*0.38, vx + vw*0.62, vx + vw*0.85];
    var xsBot = [vx + vw*0.25, vx + vw*0.5,  vx + vw*0.75];
    var xs = xsTop.concat(xsBot);
    var ys = [0.35, 0.35, 0.35, 0.35, 0.7, 0.7, 0.7].map(function(f) { return vy + vh * f; });
    return OBJ_SHAPES.map(function(shape, i) {
      return { id: 'sel-' + i, shape: shape, colour: 'blue', size: 'medium',
               rotation: 0, x: xs[i], y: ys[i], selected: false, zIndex: i };
    });
  }

  window.addEventListener('page:control', function(e) {
    var type = e.detail.type;
    var LOCK_CTRL = {
      'LOCK_COLOUR_CONTROLS':   function() { objLocks.colour = true; },
      'LOCK_SIZE_CONTROLS':     function() { objLocks.size = true; },
      'LOCK_SHAPE_CONTROLS':    function() { objLocks.shape = true; },
      'LOCK_ADD_REMOVE':        function() { objLocks.addRemove = true; },
      'LOCK_DIRECTION_BUTTONS': function() { objLocks.direction = true; },
      'LOCK_ROTATION':          function() { objLocks.rotation = true; },
      'UNLOCK_ALL':             function() { objLocks = {}; },
      'PAGE_CONTROL_RESET':     function() { objLocks = {}; _spawnIndex = 0; },
      'CLEAR_CANVAS':           function() {
        state = Object.assign({}, state, { objects: [], stackObjects: [], deletedObject: null });
        _spawnIndex = 0;
      },
      'SETUP_COLOUR_SELECTION': function() { _placeSelectionObjects(_buildColourSelectionObjects()); },
      'SETUP_SHAPE_SELECTION':  function() { _placeSelectionObjects(_buildShapeSelectionObjects()); },
      'NEXT_COLOUR_ROUND':      function() { _shuffleObjectPositions(); },
      'NEXT_SHAPE_ROUND':       function() { _shuffleObjectPositions(); },
      'SPAWN_TRIANGLE': function() {
        var cx = state.viewport.x + state.viewport.width / 2;
        var cy = state.viewport.y + state.viewport.height / 2;
        state = addObject(state, cx, cy);
        var objs = state.objects;
        var newest = objs[objs.length - 1];
        var updated = Object.assign({}, newest, { shape: 'triangle', colour: 'blue', size: 'medium', rotation: 0, selected: true });
        state = Object.assign({}, state, { objects: objs.slice(0, -1).concat([updated]), stackObjects: [newest.id] });
      },
      'SPAWN_CIRCLE': function() {
        var cx = state.viewport.x + state.viewport.width / 2;
        var cy = state.viewport.y + state.viewport.height / 2;
        state = addObject(state, cx, cy);
        var objs = state.objects;
        var newest = objs[objs.length - 1];
        var updated = Object.assign({}, newest, { shape: 'circle', colour: 'purple', size: 'medium', rotation: 0, selected: true });
        state = Object.assign({}, state, { objects: objs.slice(0, -1).concat([updated]), stackObjects: [newest.id] });
      },
      'SPAWN_SQUARE': function() {
        var cx = state.viewport.x + state.viewport.width / 2;
        var cy = state.viewport.y + state.viewport.height / 2;
        state = addObject(state, cx, cy);
        var objs = state.objects;
        var newest = objs[objs.length - 1];
        var updated = Object.assign({}, newest, { shape: 'square', colour: 'red', size: 'medium', rotation: 0, selected: true });
        state = Object.assign({}, state, { objects: objs.slice(0, -1).concat([updated]), stackObjects: [newest.id] });
      },
      'SPAWN_OBJECTS_5': function() {
        [[0.2, 0.35], [0.5, 0.35], [0.8, 0.35], [0.35, 0.65], [0.65, 0.65]].forEach(function(p) {
          state = addObject(state, state.viewport.x + state.viewport.width * p[0], state.viewport.y + state.viewport.height * p[1]);
        });
      }
    };
    [LOCK_CTRL[type]].filter(Boolean).forEach(function(fn) { fn(); });
    redraw();
  });
}
