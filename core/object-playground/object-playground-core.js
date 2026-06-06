var OBJ_SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'pentagon', 'star', 'heart'];
var OBJ_COLOURS = ['red', 'yellow', 'blue', 'orange', 'green', 'purple'];
var OBJ_SIZES = ['small', 'medium', 'large', 'x-large', 'xx-large'];
var OBJ_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];
var OBJ_SIZE_MAP = { small: 1.0, medium: 2.0, large: 3.0, 'x-large': 4.0, 'xx-large': 5.0 };
var OBJ_COLOUR_FILL = {
  red: '#E74C3C', yellow: '#F1C40F', blue: '#3498DB',
  orange: '#F39C12', green: '#2ECC71', purple: '#9B59B6'
};
var OBJ_COLOUR_STROKE = {
  red: '#C0392B', yellow: '#D4AC0D', blue: '#2980B9',
  orange: '#D68910', green: '#27AE60', purple: '#7D3C98'
};
var OBJ_BASE_R = 32;
var OBJ_MAX_COUNT = 20;
var OBJ_SPAWN_RADIUS = OBJ_BASE_R * 2;
var OBJ_SPAWN_CELL = 132;

function objPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function initObjectState(viewportW, viewportH) {
  var margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP['xx-large']) + 4;
  var objects = [];
  for (var i = 0; i < 10; i++) {
    objects.push({
      id: 'obj-' + i,
      shape: objPick(OBJ_SHAPES),
      colour: objPick(OBJ_COLOURS),
      size: objPick(OBJ_SIZES.slice(0, 3)),
      rotation: objPick(OBJ_ROTATIONS),
      x: viewportW + margin + Math.random() * (viewportW - margin * 2),
      y: viewportH + margin + Math.random() * (viewportH - margin * 2),
      selected: false,
      zIndex: i
    });
  }
  return {
    world: { width: viewportW * 3, height: viewportH * 3 },
    viewport: { x: viewportW, y: viewportH, width: viewportW, height: viewportH },
    objects: objects,
    stackObjects: [],
    deletedObject: null,
    nextId: 10
  };
}

function renderObjectShape(shape, colour) {
  var fill = OBJ_COLOUR_FILL[colour];
  var stroke = OBJ_COLOUR_STROKE[colour];
  var r = OBJ_BASE_R;
  var dot25 = '<circle cx="0" cy="-25" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>';
  if (shape === 'circle') {
    return '<circle r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>' + dot25;
  }
  if (shape === 'square') {
    return '<rect x="-32" y="-32" width="64" height="64" rx="6" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>' + dot25;
  }
  if (shape === 'triangle') {
    return '<polygon points="0,-32 27.7,16 -27.7,16" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/><circle cx="0" cy="-22" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>';
  }
  if (shape === 'rectangle') {
    return '<rect x="-38.4" y="-20.8" width="76.8" height="41.6" rx="6" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/><circle cx="0" cy="-17" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>';
  }
  if (shape === 'pentagon') {
    return '<polygon points="0,-32 30.4,-9.9 18.8,25.9 -18.8,25.9 -30.4,-9.9" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/>' + dot25;
  }
  if (shape === 'star') {
    return '<polygon points="0,-32 7.9,-10.9 30.4,-9.9 12.8,4.2 18.8,25.9 0,13.4 -18.8,25.9 -12.8,4.2 -30.4,-9.9 -7.9,-10.9" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/><circle cx="0" cy="-24" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>';
  }
  return '<path d="M0,22 C-28,8 -30,-10 -16,-18 C-8,-22 -2,-16 0,-9 C2,-16 8,-22 16,-18 C30,-10 28,8 0,22 Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="3"/><circle cx="14" cy="-14" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/>';
}

var OBJ_MOVE_STEP = 50;
var PAN_THRESHOLD = 5;

function buildGesture(state, tapTargetId, clientX, clientY, viewportX, viewportY, tapWorldX, tapWorldY) {
  var matching = tapTargetId ? state.objects.filter(function(o) { return o.id === tapTargetId; }) : [];
  var selObj = matching[0];
  return {
    active: true,
    onObj: !!tapTargetId,
    isSelected: !!(selObj && selObj.selected),
    originObjX: selObj ? selObj.x : 0,
    originObjY: selObj ? selObj.y : 0,
    moved: false,
    startX: clientX,
    startY: clientY,
    originX: viewportX,
    originY: viewportY,
    tapWorldX: tapWorldX || 0,
    tapWorldY: tapWorldY || 0
  };
}

function getDragMoves(gesture, dx, dy) {
  if (!gesture.active) return [];
  if (!gesture.onObj) return [];
  if (!gesture.isSelected) return [];
  if (!gesture.moved && Math.abs(dx) < PAN_THRESHOLD && Math.abs(dy) < PAN_THRESHOLD) return [];
  return [{ x: gesture.originObjX + dx, y: gesture.originObjY + dy }];
}

function updateDragPosition(state, x, y) {
  var selObjs = state.objects.filter(function(o) { return o.selected; });
  return selObjs.reduce(function(s, sel) {
    var margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP[sel.size]);
    var cx = Math.max(margin, Math.min(x, s.world.width - margin));
    var cy = Math.max(margin, Math.min(y, s.world.height - margin));
    return Object.assign({}, s, {
      objects: s.objects.map(function(o) {
        if (o.selected) { return Object.assign({}, o, { x: cx, y: cy }); }
        return o;
      })
    });
  }, state);
}

function getDragCancelMoves(gesture) {
  if (!gesture.active) return [];
  if (!gesture.isSelected) return [];
  if (!gesture.moved) return [];
  return [{ x: gesture.originObjX, y: gesture.originObjY }];
}

function applyToolboxClick(state, gesture, prop, dir) {
  var base = getDragCancelMoves(gesture).reduce(function(s, origin) {
    return updateDragPosition(s, origin.x, origin.y);
  }, state);
  return handlePropertyCycle(base, prop, dir);
}

function getPanMoves(gesture, dx, dy) {
  if (!gesture.active) return [];
  if (gesture.onObj) return [];
  if (!gesture.moved && Math.abs(dx) < PAN_THRESHOLD && Math.abs(dy) < PAN_THRESHOLD) return [];
  return [{ x: gesture.originX - dx, y: gesture.originY - dy }];
}

function getTapFlag(gesture) {
  if (!gesture.active) return [];
  if (gesture.moved) return [];
  return [true];
}

function applyPan(state, targetX, targetY) {
  var maxX = state.world.width - state.viewport.width;
  var maxY = state.world.height - state.viewport.height;
  var x = Math.max(0, Math.min(targetX, maxX));
  var y = Math.max(0, Math.min(targetY, maxY));
  return Object.assign({}, state, {
    viewport: Object.assign({}, state.viewport, { x: x, y: y })
  });
}

function cycleProperty(obj, prop, dir) {
  var CYCLES = { shape: OBJ_SHAPES, colour: OBJ_COLOURS, size: OBJ_SIZES, rotation: OBJ_ROTATIONS };
  var arr = CYCLES[prop];
  var step = dir === -1 ? -1 : 1;
  var idx = arr.indexOf(obj[prop]);
  var next = arr[(idx + step + arr.length) % arr.length];
  var updated = Object.assign({}, obj);
  updated[prop] = next;
  return updated;
}

function objectsAtPoint(state, worldX, worldY) {
  return state.objects.filter(function(o) {
    var r = OBJ_BASE_R * OBJ_SIZE_MAP[o.size];
    var dx = o.x - worldX;
    var dy = o.y - worldY;
    return dx * dx + dy * dy <= r * r;
  }).sort(function(a, b) { return b.zIndex - a.zIndex; });
}

function bringToFront(state, objId) {
  var sorted = state.objects.slice().sort(function(a, b) { return a.zIndex - b.zIndex; });
  var others = sorted.filter(function(o) { return o.id !== objId; });
  var zMap = {};
  others.forEach(function(o, i) { zMap[o.id] = i; });
  zMap[objId] = others.length;
  return Object.assign({}, state, {
    objects: state.objects.map(function(o) { return Object.assign({}, o, { zIndex: zMap[o.id] }); })
  });
}

function applyStackPick(state, objId) {
  return bringToFront(selectObject(state, objId), objId);
}

function selectObject(state, objId) {
  return Object.assign({}, state, {
    objects: state.objects.map(function(o) {
      return Object.assign({}, o, { selected: o.id === objId });
    })
  });
}

function deselectAll(state) {
  return Object.assign({}, state, {
    objects: state.objects.map(function(o) {
      return Object.assign({}, o, { selected: false });
    })
  });
}

function handleTap(state, worldX, worldY) {
  var candidates = objectsAtPoint(state, worldX, worldY);
  var stackIds = candidates.map(function(o) { return o.id; });
  var withStack = Object.assign({}, deselectAll(state), { stackObjects: stackIds });
  if (candidates.length === 1) {
    return bringToFront(selectObject(withStack, candidates[0].id), candidates[0].id);
  }
  return withStack;
}

function handlePropertyCycle(state, prop, dir) {
  return Object.assign({}, state, {
    objects: state.objects.map(function(o) {
      if (o.selected) { return cycleProperty(o, prop, dir); }
      return o;
    })
  });
}

function canAddObject(state) {
  return state.objects.length < OBJ_MAX_COUNT;
}

function addObject(state, spawnX, spawnY) {
  var maxZ = state.objects.reduce(function(m, o) { return Math.max(m, o.zIndex); }, -1);
  var newObj = {
    id: 'obj-' + state.nextId,
    shape: objPick(OBJ_SHAPES),
    colour: objPick(OBJ_COLOURS),
    size: objPick(OBJ_SIZES.slice(0, 3)),
    rotation: objPick(OBJ_ROTATIONS),
    x: spawnX,
    y: spawnY,
    selected: false,
    zIndex: maxZ + 1
  };
  return Object.assign({}, state, {
    objects: state.objects.concat([newObj]),
    nextId: state.nextId + 1
  });
}

function removeObject(state, objId) {
  var targets = state.objects.filter(function(o) { return o.id === objId; });
  return targets.reduce(function(s, target) {
    return Object.assign({}, s, {
      objects: s.objects.filter(function(o) { return o.id !== objId; }),
      stackObjects: s.stackObjects.filter(function(id) { return id !== objId; }),
      deletedObject: { id: target.id, shape: target.shape, colour: target.colour, size: target.size, rotation: target.rotation, x: target.x, y: target.y, zIndex: target.zIndex }
    });
  }, state);
}

function restoreDeleted(state) {
  return [state.deletedObject].filter(Boolean).reduce(function(s, del) {
    return Object.assign({}, s, {
      objects: s.objects.concat([Object.assign({}, del, { selected: false })]),
      deletedObject: null
    });
  }, state);
}

function moveSelectedObject(state, dir) {
  var deltas = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  var d = deltas[dir];
  if (!d) return state;
  return Object.assign({}, state, {
    objects: state.objects.map(function(o) {
      if (!o.selected) return o;
      var margin = Math.ceil(OBJ_BASE_R * OBJ_SIZE_MAP[o.size]);
      var nx = Math.max(margin, Math.min(o.x + d[0] * OBJ_MOVE_STEP, state.world.width - margin));
      var ny = Math.max(margin, Math.min(o.y + d[1] * OBJ_MOVE_STEP, state.world.height - margin));
      return Object.assign({}, o, { x: nx, y: ny });
    })
  });
}

function buildStackHTML(stackIds, allObjects) {
  return stackIds.map(function(id) {
    var obj = allObjects.filter(function(o) { return o.id === id; })[0];
    var svgContent = renderObjectShape(obj.shape, obj.colour);
    return '<div class="obj-stack-row" data-pick="' + id + '"><svg width="36" height="36" viewBox="-36 -36 72 72">' + svgContent + '</svg></div>';
  }).join('');
}

function buildToolboxHTML(obj) {
  var rows = [
    { prop: 'shape', label: 'Shape', val: obj.shape },
    { prop: 'colour', label: 'Colour', val: obj.colour },
    { prop: 'size', label: 'Size', val: obj.size }
  ];
  var propHtml = rows.map(function(r) {
    return '<div class="obj-tool-row" data-prop="' + r.prop + '"><span class="obj-tool-label">' + r.label + '</span><span class="obj-tool-val">' + r.val + '</span></div>';
  }).join('');
  var rotHtml = [
    { dir: 'cw',  arrow: '\u21bb', label: 'Spin' },
    { dir: 'acw', arrow: '\u21ba', label: 'Spin back' }
  ].map(function(r) {
    return '<div class="obj-tool-row" data-prop="rotation" data-rot-dir="' + r.dir + '"><span class="obj-tool-label">' + r.arrow + ' ' + r.label + '</span><span class="obj-tool-val">' + obj.rotation + '\u00b0</span></div>';
  }).join('');
  propHtml += rotHtml;
  var dirHtml = [
    { action: 'move-left',  label: '\u2B05', val: 'Left'  },
    { action: 'move-right', label: '\u27A1', val: 'Right' },
    { action: 'move-up',    label: '\u2B06', val: 'Up'    },
    { action: 'move-down',  label: '\u2B07', val: 'Down'  }
  ].map(function(d) {
    return '<div class="obj-tool-row" data-action="' + d.action + '"><span class="obj-tool-label">' + d.label + '</span><span class="obj-tool-val">' + d.val + '</span></div>';
  }).join('');
  return propHtml + dirHtml + '<div class="obj-tool-row obj-tool-delete" data-action="delete"><span class="obj-tool-label">Delete</span><span class="obj-tool-val">\u2715</span></div>';
}

var OBJ_ANIM_DURATION = 175;

function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }

function objTransform(pos, rotation, scale) {
  return 'translate(' + pos.x.toFixed(1) + ',' + pos.y.toFixed(1) + ') rotate(' + rotation + ') scale(' + scale + ')';
}

// Predictable left-to-right fill: object `index` lands in slot `index`, wrapping
// to a new row when the next slot would run past the viewport width. Keeps a
// repeating colour sequence (e.g. Pattern Maker red/blue/red/blue) reading as a
// row instead of scattering across the canvas.
function gridSpawn(viewport, index) {
  var margin = OBJ_BASE_R * 2 + 8;
  var cols = Math.max(1, Math.floor((viewport.width - margin * 2) / OBJ_SPAWN_CELL) + 1);
  return {
    x: viewport.x + margin + (index % cols) * OBJ_SPAWN_CELL,
    y: viewport.y + margin + Math.floor(index / cols) * OBJ_SPAWN_CELL
  };
}

function getVisualPos(obj, animMap) {
  var anim = animMap[obj.id];
  if (!anim) return { x: obj.x, y: obj.y };
  var t = Math.min(1, (Date.now() - anim.startTime) / OBJ_ANIM_DURATION);
  if (t >= 1) { delete animMap[obj.id]; return { x: obj.x, y: obj.y }; }
  var e = easeOutQuad(t);
  return { x: anim.fromX + (anim.toX - anim.fromX) * e, y: anim.fromY + (anim.toY - anim.fromY) * e };
}

if (typeof module !== 'undefined') module.exports = {
  OBJ_SHAPES, OBJ_COLOURS, OBJ_SIZES, OBJ_ROTATIONS, OBJ_SIZE_MAP,
  OBJ_COLOUR_FILL, OBJ_COLOUR_STROKE, OBJ_BASE_R, OBJ_MAX_COUNT, OBJ_SPAWN_RADIUS,
  OBJ_MOVE_STEP,
  objPick, initObjectState, renderObjectShape,
  PAN_THRESHOLD, buildGesture, getDragMoves, updateDragPosition, getDragCancelMoves, applyToolboxClick,
  getPanMoves, getTapFlag, applyPan,
  objectsAtPoint, bringToFront, applyStackPick,
  cycleProperty, selectObject, deselectAll, handleTap, handlePropertyCycle, buildStackHTML, buildToolboxHTML,
  canAddObject, addObject, removeObject, restoreDeleted, moveSelectedObject,
  easeOutQuad, objTransform, getVisualPos, OBJ_ANIM_DURATION,
  OBJ_SPAWN_CELL, gridSpawn
};
