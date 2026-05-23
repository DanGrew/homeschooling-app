function renderObjects(svgEl, state) {
  var existing = svgEl.querySelectorAll('[data-obj]');
  existing.forEach(function(el) { el.parentNode.removeChild(el); });

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
    svgEl.appendChild(g);
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

  function redraw() {
    renderObjects(svgEl, state);
    renderToolbox(toolboxEl, state);
  }

  redraw();

  svgEl.addEventListener('click', function(e) {
    var g = e.target.closest('[data-obj]');
    [g].filter(Boolean).forEach(function(el) {
      state = handleTap(state, el.getAttribute('data-obj'));
      redraw();
    });
  });

  toolboxEl.addEventListener('click', function(e) {
    var row = e.target.closest('[data-prop]');
    [row].filter(Boolean).forEach(function(el) {
      state = handlePropertyCycle(state, el.getAttribute('data-prop'));
      redraw();
    });
  });
}
