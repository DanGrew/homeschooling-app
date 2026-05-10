export function evalCond(state, cond) {
  if (cond && typeof cond === 'object') {
    if (cond.all) return cond.all.every(c => evalCond(state, c));
    if (cond.any) return cond.any.some(c => evalCond(state, c));
  }
  const m = String(cond).match(/^state\.(\w+)\s*(>=|==|<=|>|<)\s*(\d+)$/);
  if (!m) return false;
  const [, key, op, val] = m;
  const a = state[key], b = parseInt(val);
  if (op === '>=') return a >= b;
  if (op === '==') return a == b;
  if (op === '<=') return a <= b;
  if (op === '>') return a > b;
  return a < b;
}

export function applyStateAction(state, action) {
  const sm = action.match(/^state\.(\w+)\s*(\+=|-=|=)\s*(\d+)$/);
  if (!sm) return false;
  const [, key, op, val] = sm;
  const n = parseInt(val);
  if (op === '+=') state[key] += n;
  else if (op === '-=') state[key] = Math.max(0, state[key] - n);
  else state[key] = n;
  return true;
}

export function resolveScene(scene) {
  return {
    bgColor: scene.bg_color || '#f0f8e8',
    spritesPath: scene.sprites_path || 'sprites/',
  };
}

export function resolveImgFit(fit) {
  return fit || 'contain';
}

export function resolveImgSrc(spritesPath, name) {
  return spritesPath + name + (name.includes('.') ? '' : '.png');
}

export function resolveObject(obj) {
  return Object.assign({ label: '', fit: 'contain', visible: true, clickable: false }, obj);
}

export function objectRenderType(obj) {
  if (obj.type === 'button') return 'button';
  if (obj.sprite_states) return 'sprite_states';
  return 'sprite';
}

var KNOWN_ANIMS = new Set(['grow', 'splash', 'glow', 'dirt', 'celebrate', 'shine', 'shake']);

export function resolveAnimName(name) {
  return KNOWN_ANIMS.has(name) ? name : '_default';
}

export function nextSpriteIdx(spriteStates, currentIdx, delta) {
  if (!spriteStates) return 0;
  return Math.min((currentIdx || 0) + delta, spriteStates.length - 1);
}

export function parseAction(action) {
  if (action === 'reset') return { type: 'reset', args: [] };
  if (/^state\.\w+\s*(\+=|-=|=)\s*\d+$/.test(action)) return { type: 'state', args: [action] };
  var am = action.match(/^animate:\s*(.+)$/);
  if (am) return { type: 'animate', args: [am[1].trim()] };
  var say = action.match(/^say:\s*(.+)$/);
  if (say) return { type: 'say', args: [say[1].trim()] };
  var show = action.match(/^show:\s*(\S+)$/);
  if (show) return { type: 'show', args: [show[1]] };
  var hide = action.match(/^hide:\s*(\S+)$/);
  if (hide) return { type: 'hide', args: [hide[1]] };
  var fi = action.match(/^fade_in:\s*(\S+)(?:\s+(\d+))?$/);
  if (fi) return { type: 'fade_in', args: [fi[1], fi[2] ? parseInt(fi[2]) : 800] };
  var fo = action.match(/^fade_out:\s*(\S+)(?:\s+(\d+))?$/);
  if (fo) return { type: 'fade_out', args: [fo[1], fo[2] ? parseInt(fo[2]) : 800] };
  var st = action.match(/^show_tool:\s*(\S+)$/);
  if (st) return { type: 'show_tool', args: [st[1]] };
  var ht = action.match(/^hide_tool:\s*(\S+)$/);
  if (ht) return { type: 'hide_tool', args: [ht[1]] };
  var ss = action.match(/^set_sprite:\s*(\S+)\s+(\d+)$/);
  if (ss) return { type: 'set_sprite', args: [ss[1], parseInt(ss[2])] };
  var adv = action.match(/^advance_sprite:\s*(\S+)$/);
  if (adv) return { type: 'advance_sprite', args: [adv[1]] };
  var sa = action.match(/^splash_at:\s*(-?\d+)\s+(-?\d+)$/);
  if (sa) return { type: 'splash_at', args: [parseInt(sa[1]), parseInt(sa[2])] };
  var fx = action.match(/^flip_x:\s*(\S+)$/);
  if (fx) return { type: 'flip_x', args: [fx[1]] };
  var mv = action.match(/^move:\s*(\S+)\s+(-?\d+)\s+(-?\d+)$/);
  if (mv) return { type: 'move', args: [mv[1], mv[2], mv[3]] };
  var dl = action.match(/^delay:\s*(\d+)\s+(.+)$/);
  if (dl) return { type: 'delay', args: [parseInt(dl[1]), dl[2].trim()] };
  var sht = action.match(/^show_tray:\s*(.+)$/);
  if (sht) return { type: 'show_tray', args: sht[1].trim().split(/\s+/) };
  if (action === 'hide_tray') return { type: 'hide_tray', args: [] };
  return { type: 'noop', args: [] };
}

export function findAction(spec, state, objectId, selectedTool, won) {
  var obj = spec.objects.find(function(o) { return o.id === objectId; });
  if (won && !(obj && obj.always_clickable)) return { type: 'none' };

  if (selectedTool) {
    var exactMatch = spec.actions.find(function(a) {
      return a.when.tool_tap &&
        a.when.tool_tap.tool === selectedTool &&
        a.when.tool_tap.target === objectId &&
        (!a.when.if || evalCond(state, a.when.if));
    });
    if (exactMatch) return { type: 'exec', actions: exactMatch.do, clearTool: true };

    var rightToolWrongStage = spec.actions.find(function(a) {
      return a.when.tool_tap &&
        a.when.tool_tap.tool === selectedTool &&
        a.when.tool_tap.target === objectId;
    });
    if (rightToolWrongStage) return { type: 'say', text: 'Not yet \u2014 keep going!' };

    var anyToolForTarget = spec.actions.find(function(a) {
      return a.when.tool_tap && a.when.tool_tap.target === objectId;
    });
    if (anyToolForTarget) return { type: 'say', text: 'Try a different tool!' };
  }

  var tapAction = spec.actions.find(function(a) {
    return a.when.tap === objectId && (!a.when.if || evalCond(state, a.when.if));
  });
  if (tapAction) return { type: 'exec', actions: tapAction.do, clearTool: false };

  if (spec.toolbar) {
    var hasToolAction = spec.actions.some(function(a) {
      return a.when.tool_tap && a.when.tool_tap.target === objectId;
    });
    if (hasToolAction) return { type: 'say', text: 'Pick a tool first!' };
  }

  return { type: 'none' };
}

export function shouldTriggerWin(spec, state, won) {
  return !won && evalCond(state, spec.win_condition);
}

if (typeof module !== 'undefined') module.exports = {
  evalCond, applyStateAction, resolveScene, resolveImgFit, resolveImgSrc, resolveObject,
  objectRenderType, resolveAnimName, nextSpriteIdx, parseAction, findAction, shouldTriggerWin,
};
