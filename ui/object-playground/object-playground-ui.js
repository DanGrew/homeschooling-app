function renderObjects(svgEl, state) {
  var existing = svgEl.querySelectorAll('[data-obj]');
  existing.forEach(function(el) { el.parentNode.removeChild(el); });

  var sorted = state.objects.slice().sort(function(a, b) { return a.zIndex - b.zIndex; });
  sorted.forEach(function(obj) {
    var s = OBJ_SIZE_MAP[obj.size];
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('data-obj', obj.id);
    g.setAttribute('data-testid', 'object-' + obj.id);
    g.setAttribute('transform',
      'translate(' + obj.x.toFixed(1) + ',' + obj.y.toFixed(1) + ') rotate(' + obj.rotation + ') scale(' + s + ')'
    );
    g.innerHTML = renderObjectShape(obj.shape, obj.colour);
    svgEl.appendChild(g);
  });
}

function initObjectPlayground() {
  var wrap = document.getElementById('obj-viewport');
  var svgEl = document.getElementById('obj-world');
  var w = wrap.clientWidth;
  var h = wrap.clientHeight;
  var state = initObjectState(w, h);

  svgEl.setAttribute('width', state.world.width);
  svgEl.setAttribute('height', state.world.height);

  renderObjects(svgEl, state);
}
