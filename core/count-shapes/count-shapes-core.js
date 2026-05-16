var SVG_SHAPE = {
  'circle':   '<circle cx="40" cy="40" r="36" fill="#F39C12"/>',
  'square':   '<rect x="4" y="4" width="72" height="72" rx="10" fill="#F39C12"/>',
  'triangle': '<polygon points="40,4 76,76 4,76" fill="#F39C12"/>'
};

function svg(t) {
  return '<svg width="80" height="80" viewBox="0 0 80 80" style="width:min(80px,15vw);height:min(80px,15vw)">' + SVG_SHAPE[t] + '</svg>';
}

if (typeof module !== 'undefined') module.exports = { SVG_SHAPE, svg };
