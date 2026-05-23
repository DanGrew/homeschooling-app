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
    [obj].filter(function(o) { return o.selected; }).forEach(function() {
      g.style.filter = 'drop-shadow(0 0 8px #fff) drop-shadow(0 0 4px #333)';
    });
    layer.appendChild(g);
  });
}

function renderToolbox(toolboxEl, state) {
  toolboxEl.style.display = 'none';
  var sel = state.objects.filter(function(o) { return o.selected; });
  sel.forEach(function(obj) {
    toolboxEl.innerHTML = buildToolboxHTML(obj);
    toolboxEl.style.display = 'flex';
  });
}

function initObjectPlayground() {
  var wrap = document.getElementById('obj-viewport');
  var svgEl = document.getElementById('obj-world');
  var toolboxEl = document.getElementById('obj-toolbox');
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
  }

  redraw();

  var panGesture = { active: false };

  svgEl.addEventListener('pointerdown', function(e) {
    svgEl.setPointerCapture(e.pointerId);
    var tapTarget = e.target.closest('[data-obj]');
    panGesture = {
      active: true,
      tapTarget: tapTarget,
      onObj: !!tapTarget,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originX: state.viewport.x,
      originY: state.viewport.y
    };
  });

  svgEl.addEventListener('pointermove', function(e) {
    var dx = e.clientX - panGesture.startX;
    var dy = e.clientY - panGesture.startY;
    getPanMoves(panGesture, dx, dy).forEach(function(move) {
      panGesture = Object.assign({}, panGesture, { moved: true });
      state = applyPan(state, move.x, move.y);
      redraw();
    });
  });

  svgEl.addEventListener('pointerup', function() {
    var gesture = panGesture;
    panGesture = { active: false };
    getTapFlag(gesture).forEach(function() {
      [gesture.tapTarget].filter(Boolean).forEach(function(el) {
        state = handleTap(state, el.getAttribute('data-obj'));
        redraw();
      });
    });
  });

  svgEl.addEventListener('pointercancel', function() {
    panGesture = { active: false };
  });

  toolboxEl.addEventListener('click', function(e) {
    var row = e.target.closest('[data-prop]');
    [row].filter(Boolean).forEach(function(el) {
      state = handlePropertyCycle(state, el.getAttribute('data-prop'));
      redraw();
    });
  });
}
