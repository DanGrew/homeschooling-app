var OBJ_SHAPES = ['circle', 'square', 'triangle'];
var OBJ_COLOURS = ['red', 'blue', 'yellow', 'green'];
var OBJ_SIZES = ['small', 'medium', 'large'];
var OBJ_ROTATIONS = [0, 90, 180, 270];
var OBJ_SIZE_MAP = { small: 0.6, medium: 1.0, large: 1.4 };
var OBJ_COLOUR_FILL = {
  red: '#E74C3C', blue: '#3498DB', yellow: '#F1C40F', green: '#2ECC71'
};
var OBJ_COLOUR_STROKE = {
  red: '#C0392B', blue: '#2980B9', yellow: '#D4AC0D', green: '#27AE60'
};
var OBJ_BASE_R = 32;

function objPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function initObjectState(viewportW, viewportH) {
  var margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP.large) + 4;
  var objects = [];
  for (var i = 0; i < 10; i++) {
    objects.push({
      id: 'obj-' + i,
      shape: objPick(OBJ_SHAPES),
      colour: objPick(OBJ_COLOURS),
      size: objPick(OBJ_SIZES),
      rotation: objPick(OBJ_ROTATIONS),
      x: margin + Math.random() * (viewportW - margin * 2),
      y: margin + Math.random() * (viewportH - margin * 2),
      selected: false,
      zIndex: i
    });
  }
  return {
    world: { width: viewportW * 3, height: viewportH * 3 },
    viewport: { x: 0, y: 0 },
    objects: objects
  };
}

function renderObjectShape(shape, colour) {
  var fill = OBJ_COLOUR_FILL[colour];
  var stroke = OBJ_COLOUR_STROKE[colour];
  var r = OBJ_BASE_R;
  if (shape === 'circle') {
    return '<circle r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>';
  }
  if (shape === 'square') {
    return '<rect x="' + (-r) + '" y="' + (-r) + '" width="' + (r * 2) + '" height="' + (r * 2) + '" rx="6" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>';
  }
  var x2 = (r * Math.sqrt(3) / 2).toFixed(1);
  var y2 = (r * 0.5).toFixed(1);
  var pts = '0,' + (-r) + ' ' + x2 + ',' + y2 + ' -' + x2 + ',' + y2;
  return '<polygon points="' + pts + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>';
}

if (typeof module !== 'undefined') module.exports = {
  OBJ_SHAPES, OBJ_COLOURS, OBJ_SIZES, OBJ_ROTATIONS, OBJ_SIZE_MAP,
  OBJ_COLOUR_FILL, OBJ_COLOUR_STROKE, OBJ_BASE_R,
  objPick, initObjectState, renderObjectShape
};
