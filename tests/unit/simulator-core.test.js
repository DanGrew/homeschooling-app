import { createRequire } from 'module';
import {
  evalCond, applyStateAction, resolveScene, resolveImgFit, resolveImgSrc, resolveObject,
  objectRenderType, resolveAnimName, nextSpriteIdx, parseAction, findAction, shouldTriggerWin,
  gridMajorKey,
} from '../../core/simulator/simulator-core.js';

const require = createRequire(import.meta.url);
const cjs = require('../../core/simulator/simulator-core.js');

describe('evalCond — state comparisons', () => {
  it('>= true when equal', () => expect(evalCond({ x: 3 }, 'state.x >= 3')).toBe(true));
  it('>= true when greater', () => expect(evalCond({ x: 5 }, 'state.x >= 3')).toBe(true));
  it('>= false when less', () => expect(evalCond({ x: 2 }, 'state.x >= 3')).toBe(false));
  it('== true', () => expect(evalCond({ x: 2 }, 'state.x == 2')).toBe(true));
  it('== false', () => expect(evalCond({ x: 1 }, 'state.x == 2')).toBe(false));
  it('<= true when equal', () => expect(evalCond({ x: 3 }, 'state.x <= 3')).toBe(true));
  it('<= false when greater', () => expect(evalCond({ x: 4 }, 'state.x <= 3')).toBe(false));
  it('> true', () => expect(evalCond({ x: 5 }, 'state.x > 3')).toBe(true));
  it('> false when equal', () => expect(evalCond({ x: 3 }, 'state.x > 3')).toBe(false));
  it('< true', () => expect(evalCond({ x: 1 }, 'state.x < 3')).toBe(true));
  it('< false when equal', () => expect(evalCond({ x: 3 }, 'state.x < 3')).toBe(false));
  it('returns false for malformed string', () => expect(evalCond({}, 'not_valid')).toBe(false));
  it('returns false for null', () => expect(evalCond({}, null)).toBe(false));
  it('returns false for unknown key', () => expect(evalCond({}, 'state.missing >= 1')).toBe(false));
  it('ignores leading text before the state expression', () => expect(evalCond({ x: 1 }, 'xxstate.x >= 1')).toBe(false));
  it('ignores trailing text after the value', () => expect(evalCond({ x: 1 }, 'state.x >= 1xx')).toBe(false));
  it('reads a multi-digit value', () => expect(evalCond({ x: 12 }, 'state.x >= 12')).toBe(true));
  it('allows no space before the operator', () => expect(evalCond({ x: 1 }, 'state.x>=1')).toBe(true));
  it('allows no space after the operator', () => expect(evalCond({ x: 1 }, 'state.x >=1')).toBe(true));
  it('does not treat a truthy non-object with an all-shaped property as a combinator', () => {
    const cond = function () {};
    cond.all = ['state.x >= 1'];
    expect(evalCond({ x: 1 }, cond)).toBe(false);
  });
});

describe('evalCond — combinators', () => {
  it('all: true when all pass', () => expect(evalCond({ a: 2, b: 5 }, { all: ['state.a >= 2', 'state.b >= 5'] })).toBe(true));
  it('all: false when one fails', () => expect(evalCond({ a: 2, b: 4 }, { all: ['state.a >= 2', 'state.b >= 5'] })).toBe(false));
  it('any: true when one passes', () => expect(evalCond({ a: 2, b: 0 }, { any: ['state.a >= 2', 'state.b >= 5'] })).toBe(true));
  it('any: false when none pass', () => expect(evalCond({ a: 1, b: 1 }, { any: ['state.a >= 2', 'state.b >= 5'] })).toBe(false));
  it('nested all inside any', () => {
    const cond = { any: [{ all: ['state.a >= 3', 'state.b >= 3'] }, 'state.c >= 5'] };
    expect(evalCond({ a: 3, b: 3, c: 0 }, cond)).toBe(true);
  });
  it('returns false for an object with neither all nor any', () => expect(evalCond({}, {})).toBe(false));
});

describe('applyStateAction', () => {
  it('+= increments', () => { const s = { x: 2 }; applyStateAction(s, 'state.x += 3'); expect(s.x).toBe(5); });
  it('-= decrements', () => { const s = { x: 5 }; applyStateAction(s, 'state.x -= 2'); expect(s.x).toBe(3); });
  it('-= clamps to 0', () => { const s = { x: 1 }; applyStateAction(s, 'state.x -= 10'); expect(s.x).toBe(0); });
  it('= assigns', () => { const s = { x: 0 }; applyStateAction(s, 'state.x = 7'); expect(s.x).toBe(7); });
  it('returns true for state action', () => expect(applyStateAction({ x: 0 }, 'state.x += 1')).toBe(true));
  it('returns false for non-state action', () => expect(applyStateAction({}, 'say: hello')).toBe(false));
  it('returns false for unrecognised', () => expect(applyStateAction({}, 'unknown')).toBe(false));
  it('ignores leading text before the state expression', () => expect(applyStateAction({ x: 0 }, 'xstate.x += 1')).toBe(false));
  it('ignores trailing text after the value', () => expect(applyStateAction({ x: 0 }, 'state.x += 1extra')).toBe(false));
  it('allows no space before the operator', () => { const s = { x: 0 }; expect(applyStateAction(s, 'state.x+=1')).toBe(true); expect(s.x).toBe(1); });
  it('allows no space after the operator', () => { const s = { x: 0 }; expect(applyStateAction(s, 'state.x +=1')).toBe(true); expect(s.x).toBe(1); });
});

describe('resolveScene', () => {
  it('uses provided bg_color and sprites_path', () => {
    expect(resolveScene({ bg_color: '#fff', sprites_path: 'img/' })).toEqual({ bgColor: '#fff', spritesPath: 'img/' });
  });
  it('falls back to defaults when properties absent', () => {
    expect(resolveScene({})).toEqual({ bgColor: '#f0f8e8', spritesPath: 'sprites/' });
  });
});

describe('resolveImgFit', () => {
  it('returns provided fit', () => expect(resolveImgFit('cover')).toBe('cover'));
  it('falls back to contain when absent', () => expect(resolveImgFit(undefined)).toBe('contain'));
});

describe('resolveImgSrc', () => {
  it('appends .png when no extension', () => expect(resolveImgSrc('sprites/', 'cat')).toBe('sprites/cat.png'));
  it('keeps extension when already present', () => expect(resolveImgSrc('sprites/', 'cat.gif')).toBe('sprites/cat.gif'));
  it('keeps .png extension', () => expect(resolveImgSrc('sprites/', 'cat.png')).toBe('sprites/cat.png'));
});

describe('resolveObject', () => {
  it('applies defaults for missing properties', () => {
    const obj = resolveObject({ id: 'x', x: 0, y: 0, w: 10, h: 10 });
    expect(obj.label).toBe('');
    expect(obj.fit).toBe('contain');
    expect(obj.visible).toBe(true);
    expect(obj.clickable).toBe(false);
  });
  it('preserves explicit values', () => {
    const obj = resolveObject({ label: 'Go!', fit: 'cover', visible: false, clickable: true });
    expect(obj.label).toBe('Go!');
    expect(obj.fit).toBe('cover');
    expect(obj.visible).toBe(false);
    expect(obj.clickable).toBe(true);
  });
});

describe('objectRenderType', () => {
  it('button type', () => expect(objectRenderType({ type: 'button' })).toBe('button'));
  it('sprite_states when array present', () => expect(objectRenderType({ sprite_states: ['a', 'b'] })).toBe('sprite_states'));
  it('sprite as fallback', () => expect(objectRenderType({ sprite: 'cat' })).toBe('sprite'));
  it('button takes priority over sprite_states', () => expect(objectRenderType({ type: 'button', sprite_states: ['a'] })).toBe('button'));
});

describe('resolveAnimName', () => {
  it('returns known names unchanged', () => {
    ['grow', 'splash', 'glow', 'dirt', 'celebrate', 'shine'].forEach(name => {
      expect(resolveAnimName(name)).toBe(name);
    });
  });
  it('maps unknown names to _default', () => expect(resolveAnimName('bounce')).toBe('_default'));
  it('maps empty string to _default', () => expect(resolveAnimName('')).toBe('_default'));
});

describe('nextSpriteIdx', () => {
  it('advances by delta', () => expect(nextSpriteIdx(['a', 'b', 'c'], 0, 1)).toBe(1));
  it('clamps to last index', () => expect(nextSpriteIdx(['a', 'b'], 1, 1)).toBe(1));
  it('sets exact index via delta from 0', () => expect(nextSpriteIdx(['a', 'b', 'c'], 0, 2)).toBe(2));
  it('returns 0 when spriteStates is null', () => expect(nextSpriteIdx(null, 0, 1)).toBe(0));
  it('handles undefined currentIdx as 0', () => expect(nextSpriteIdx(['a', 'b', 'c'], undefined, 1)).toBe(1));
  it('advances from a defined non-zero currentIdx, not from 0', () => expect(nextSpriteIdx(['a', 'b', 'c', 'd', 'e'], 2, 1)).toBe(3));
});

describe('parseAction', () => {
  it('reset', () => expect(parseAction('reset')).toEqual({ type: 'reset', args: [] }));
  it('state mutation', () => expect(parseAction('state.x += 1')).toEqual({ type: 'state', args: ['state.x += 1'] }));
  it('animate', () => expect(parseAction('animate: grow flower')).toEqual({ type: 'animate', args: ['grow flower'] }));
  it('say', () => expect(parseAction('say: hello world')).toEqual({ type: 'say', args: ['hello world'] }));
  it('show', () => expect(parseAction('show: obj1')).toEqual({ type: 'show', args: ['obj1'] }));
  it('hide', () => expect(parseAction('hide: obj1')).toEqual({ type: 'hide', args: ['obj1'] }));
  it('fade_in default duration', () => expect(parseAction('fade_in: obj1')).toEqual({ type: 'fade_in', args: ['obj1', 800] }));
  it('fade_in custom duration', () => expect(parseAction('fade_in: obj1 400')).toEqual({ type: 'fade_in', args: ['obj1', 400] }));
  it('fade_out default duration', () => expect(parseAction('fade_out: obj1')).toEqual({ type: 'fade_out', args: ['obj1', 800] }));
  it('show_tool', () => expect(parseAction('show_tool: brush')).toEqual({ type: 'show_tool', args: ['brush'] }));
  it('hide_tool', () => expect(parseAction('hide_tool: brush')).toEqual({ type: 'hide_tool', args: ['brush'] }));
  it('set_sprite', () => expect(parseAction('set_sprite: actor 2')).toEqual({ type: 'set_sprite', args: ['actor', 2] }));
  it('advance_sprite', () => expect(parseAction('advance_sprite: actor')).toEqual({ type: 'advance_sprite', args: ['actor'] }));
  it('move positive coords', () => expect(parseAction('move: obj1 100 200')).toEqual({ type: 'move', args: ['obj1', '100', '200'] }));
  it('move negative coords', () => expect(parseAction('move: obj1 -90 -60')).toEqual({ type: 'move', args: ['obj1', '-90', '-60'] }));
  it('move mixed sign coords', () => expect(parseAction('move: obj1 -90 60')).toEqual({ type: 'move', args: ['obj1', '-90', '60'] }));
  it('delay', () => expect(parseAction('delay: 750 show: obj1')).toEqual({ type: 'delay', args: [750, 'show: obj1'] }));
  it('delay with complex action', () => expect(parseAction('delay: 1500 set_sprite: character 2')).toEqual({ type: 'delay', args: [1500, 'set_sprite: character 2'] }));
  it('show_tray single', () => expect(parseAction('show_tray: card_a')).toEqual({ type: 'show_tray', args: ['card_a'] }));
  it('show_tray multiple', () => expect(parseAction('show_tray: card_a card_b card_c')).toEqual({ type: 'show_tray', args: ['card_a', 'card_b', 'card_c'] }));
  it('hide_tray', () => expect(parseAction('hide_tray')).toEqual({ type: 'hide_tray', args: [] }));
  it('splash_at', () => expect(parseAction('splash_at: 100 250')).toEqual({ type: 'splash_at', args: [100, 250] }));
  it('splash_at negative coords', () => expect(parseAction('splash_at: -10 300')).toEqual({ type: 'splash_at', args: [-10, 300] }));
  it('flip_x', () => expect(parseAction('flip_x: character')).toEqual({ type: 'flip_x', args: ['character'] }));
  it('unknown returns noop', () => expect(parseAction('gobbledygook')).toEqual({ type: 'noop', args: [] }));
});

describe('parseAction — regex boundaries', () => {
  describe('state', () => {
    it('rejects leading text', () => expect(parseAction('xstate.x += 1').type).toBe('noop'));
    it('rejects trailing text', () => expect(parseAction('state.x += 1extra').type).toBe('noop'));
    it('allows no space before the operator', () => expect(parseAction('state.x+=1')).toEqual({ type: 'state', args: ['state.x+=1'] }));
    it('allows no space after the operator', () => expect(parseAction('state.x +=1')).toEqual({ type: 'state', args: ['state.x +=1'] }));
  });

  describe('animate', () => {
    it('rejects leading text', () => expect(parseAction('xanimate: grow').type).toBe('noop'));
    it('rejects an embedded trailing newline', () => expect(parseAction('animate: grow\n').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('animate:grow')).toEqual({ type: 'animate', args: ['grow'] }));
    it('trims trailing whitespace from the message', () => expect(parseAction('animate: grow flower  ')).toEqual({ type: 'animate', args: ['grow flower'] }));
  });

  describe('say', () => {
    it('rejects leading text', () => expect(parseAction('xsay: hello').type).toBe('noop'));
    it('rejects an embedded trailing newline', () => expect(parseAction('say: hello\n').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('say:hello')).toEqual({ type: 'say', args: ['hello'] }));
    it('trims trailing whitespace from the message', () => expect(parseAction('say: hello world  ')).toEqual({ type: 'say', args: ['hello world'] }));
  });

  describe('show', () => {
    it('rejects trailing text', () => expect(parseAction('show: obj1 x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('show:obj1')).toEqual({ type: 'show', args: ['obj1'] }));
  });

  describe('hide', () => {
    it('rejects leading text', () => expect(parseAction('xhide: obj1').type).toBe('noop'));
    it('rejects trailing text', () => expect(parseAction('hide: obj1 x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('hide:obj1')).toEqual({ type: 'hide', args: ['obj1'] }));
  });

  describe('fade_in', () => {
    it('rejects leading text', () => expect(parseAction('xfade_in: obj1').type).toBe('noop'));
    it('rejects a non-numeric duration', () => expect(parseAction('fade_in: obj1 x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('fade_in:obj1')).toEqual({ type: 'fade_in', args: ['obj1', 800] }));
    it('allows multiple spaces before the duration', () => expect(parseAction('fade_in: obj1  400')).toEqual({ type: 'fade_in', args: ['obj1', 400] }));
  });

  describe('fade_out', () => {
    it('default duration', () => expect(parseAction('fade_out: obj1')).toEqual({ type: 'fade_out', args: ['obj1', 800] }));
    it('custom multi-digit duration', () => expect(parseAction('fade_out: obj1 400')).toEqual({ type: 'fade_out', args: ['obj1', 400] }));
    it('allows multiple spaces before the duration', () => expect(parseAction('fade_out: obj1  400')).toEqual({ type: 'fade_out', args: ['obj1', 400] }));
    it('rejects leading text', () => expect(parseAction('xfade_out: obj1').type).toBe('noop'));
    it('rejects a non-numeric duration', () => expect(parseAction('fade_out: obj1 x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('fade_out:obj1')).toEqual({ type: 'fade_out', args: ['obj1', 800] }));
  });

  describe('show_tool', () => {
    it('rejects leading text', () => expect(parseAction('xshow_tool: brush').type).toBe('noop'));
    it('rejects trailing text', () => expect(parseAction('show_tool: brush x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('show_tool:brush')).toEqual({ type: 'show_tool', args: ['brush'] }));
  });

  describe('hide_tool', () => {
    it('rejects leading text', () => expect(parseAction('xhide_tool: brush').type).toBe('noop'));
    it('rejects trailing text', () => expect(parseAction('hide_tool: brush x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('hide_tool:brush')).toEqual({ type: 'hide_tool', args: ['brush'] }));
  });

  describe('set_sprite', () => {
    it('rejects trailing text', () => expect(parseAction('set_sprite: actor 2x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('set_sprite:actor 2')).toEqual({ type: 'set_sprite', args: ['actor', 2] }));
    it('allows multiple spaces before the index', () => expect(parseAction('set_sprite: actor  2')).toEqual({ type: 'set_sprite', args: ['actor', 2] }));
    it('reads a multi-digit index', () => expect(parseAction('set_sprite: actor 20')).toEqual({ type: 'set_sprite', args: ['actor', 20] }));
  });

  describe('advance_sprite', () => {
    it('rejects leading text', () => expect(parseAction('xadvance_sprite: actor').type).toBe('noop'));
    it('rejects trailing text', () => expect(parseAction('advance_sprite: actor x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('advance_sprite:actor')).toEqual({ type: 'advance_sprite', args: ['actor'] }));
  });

  describe('splash_at', () => {
    it('rejects leading text', () => expect(parseAction('xsplash_at: 100 250').type).toBe('noop'));
    it('rejects trailing text', () => expect(parseAction('splash_at: 100 250x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('splash_at:100 250')).toEqual({ type: 'splash_at', args: [100, 250] }));
    it('allows multiple spaces between coordinates', () => expect(parseAction('splash_at: 100  250')).toEqual({ type: 'splash_at', args: [100, 250] }));
  });

  describe('flip_x', () => {
    it('rejects leading text', () => expect(parseAction('xflip_x: character').type).toBe('noop'));
    it('rejects trailing text', () => expect(parseAction('flip_x: character x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('flip_x:character')).toEqual({ type: 'flip_x', args: ['character'] }));
  });

  describe('move', () => {
    it('rejects leading text', () => expect(parseAction('xmove: obj1 100 200').type).toBe('noop'));
    it('rejects trailing text', () => expect(parseAction('move: obj1 100 200x').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('move:obj1 100 200')).toEqual({ type: 'move', args: ['obj1', '100', '200'] }));
    it('allows multiple spaces before the first coordinate', () => expect(parseAction('move: obj1  100 200')).toEqual({ type: 'move', args: ['obj1', '100', '200'] }));
    it('allows multiple spaces before the second coordinate', () => expect(parseAction('move: obj1 100  200')).toEqual({ type: 'move', args: ['obj1', '100', '200'] }));
  });

  describe('delay', () => {
    it('rejects leading text', () => expect(parseAction('xdelay: 750 show: obj1').type).toBe('noop'));
    it('rejects an embedded trailing newline', () => expect(parseAction('delay: 5 hello\n').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('delay:750 show: obj1')).toEqual({ type: 'delay', args: [750, 'show: obj1'] }));
    it('allows multiple spaces before the inner action', () => expect(parseAction('delay: 750  show: obj1')).toEqual({ type: 'delay', args: [750, 'show: obj1'] }));
    it('trims trailing whitespace from the inner action', () => expect(parseAction('delay: 750 show: obj1  ')).toEqual({ type: 'delay', args: [750, 'show: obj1'] }));
  });

  describe('show_tray', () => {
    it('rejects leading text', () => expect(parseAction('xshow_tray: card_a').type).toBe('noop'));
    it('rejects an embedded trailing newline', () => expect(parseAction('show_tray: card_a\n').type).toBe('noop'));
    it('allows no space after the colon', () => expect(parseAction('show_tray:card_a')).toEqual({ type: 'show_tray', args: ['card_a'] }));
    it('collapses multiple spaces between cards to one split', () => expect(parseAction('show_tray: card_a  card_b')).toEqual({ type: 'show_tray', args: ['card_a', 'card_b'] }));
    it('trims trailing whitespace before splitting', () => expect(parseAction('show_tray: card_a card_b  ')).toEqual({ type: 'show_tray', args: ['card_a', 'card_b'] }));
  });
});

describe('findAction', () => {
  function makeSpec(actions = [], toolbar = null) {
    return {
      objects: [{ id: 'btn' }, { id: 'canvas', always_clickable: true }],
      actions,
      toolbar,
      win_condition: 'state.x >= 1',
    };
  }

  it('returns exec for matching tap action', () => {
    const spec = makeSpec([{ when: { tap: 'btn' }, do: ['state.x += 1'] }]);
    const r = findAction(spec, { x: 0 }, 'btn', null, false);
    expect(r).toEqual({ type: 'exec', actions: ['state.x += 1'], clearTool: false });
  });

  it('skips tap action when condition not met', () => {
    const spec = makeSpec([{ when: { tap: 'btn', if: 'state.x >= 5' }, do: ['state.x += 1'] }]);
    const r = findAction(spec, { x: 0 }, 'btn', null, false);
    expect(r.type).toBe('none');
  });

  it('returns none when won and not always_clickable', () => {
    const spec = makeSpec([{ when: { tap: 'btn' }, do: ['state.x += 1'] }]);
    const r = findAction(spec, { x: 0 }, 'btn', null, true);
    expect(r.type).toBe('none');
  });

  it('allows always_clickable objects when won', () => {
    const spec = makeSpec([{ when: { tap: 'canvas' }, do: ['state.x += 1'] }]);
    const r = findAction(spec, { x: 0 }, 'canvas', null, true);
    expect(r.type).toBe('exec');
  });

  it('returns exec and clearTool:true for matching tool_tap', () => {
    const spec = makeSpec([{ when: { tool_tap: { tool: 'brush', target: 'canvas' } }, do: ['state.x += 1'] }]);
    const r = findAction(spec, { x: 0 }, 'canvas', 'brush', false);
    expect(r).toEqual({ type: 'exec', actions: ['state.x += 1'], clearTool: true });
  });

  it('says not yet for right tool wrong stage', () => {
    const spec = makeSpec([
      { when: { tool_tap: { tool: 'brush', target: 'canvas' }, if: 'state.x >= 5' }, do: ['state.x += 1'] },
    ]);
    const r = findAction(spec, { x: 0 }, 'canvas', 'brush', false);
    expect(r.type).toBe('say');
    expect(r.text).toContain('Not yet');
  });

  it('says try different tool when wrong tool for target', () => {
    const spec = makeSpec([
      { when: { tool_tap: { tool: 'brush', target: 'canvas' } }, do: ['state.x += 1'] },
    ]);
    const r = findAction(spec, { x: 0 }, 'canvas', 'wrong', false);
    expect(r.type).toBe('say');
    expect(r.text).toContain('different tool');
  });

  it('says pick a tool when toolbar present and target has tool action', () => {
    const spec = makeSpec([
      { when: { tool_tap: { tool: 'brush', target: 'canvas' } }, do: ['state.x += 1'] },
    ], [{ id: 'brush', sprite: 'brush' }]);
    const r = findAction(spec, { x: 0 }, 'canvas', null, false);
    expect(r.type).toBe('say');
    expect(r.text).toContain('tool');
  });

  it('ignores tool_tap actions entirely when no tool is selected', () => {
    const spec = makeSpec([{ when: { tool_tap: { tool: 'brush', target: 'canvas' } }, do: ['x'] }]);
    const r = findAction(spec, { x: 0 }, 'canvas', null, false);
    expect(r.type).toBe('none');
  });

  it('does not match a tool_tap action targeting a different object', () => {
    const spec = makeSpec([{ when: { tool_tap: { tool: 'brush', target: 'other' } }, do: ['x'] }]);
    const r = findAction(spec, { x: 0 }, 'canvas', 'brush', false);
    expect(r.type).toBe('none');
  });

  it('falls through to tap when no tool_tap actions exist for the target at all', () => {
    const spec = makeSpec([{ when: { tap: 'canvas' }, do: ['x'] }]);
    const r = findAction(spec, { x: 0 }, 'canvas', 'brush', false);
    expect(r.type).toBe('exec');
  });

  it('does not prompt to pick a tool when the spec defines no toolbar', () => {
    const spec = makeSpec([{ when: { tool_tap: { tool: 'brush', target: 'canvas' } }, do: ['x'] }], null);
    const r = findAction(spec, { x: 0 }, 'canvas', null, false);
    expect(r.type).toBe('none');
  });

  it('does not prompt to pick a tool when no tool_tap action targets this object', () => {
    const spec = makeSpec([{ when: { tool_tap: { tool: 'brush', target: 'other' } }, do: ['x'] }], [{ id: 'brush', sprite: 'brush' }]);
    const r = findAction(spec, { x: 0 }, 'canvas', null, false);
    expect(r.type).toBe('none');
  });

  it('does not prompt to pick a tool when there are no actions at all', () => {
    const spec = makeSpec([], [{ id: 'brush', sprite: 'brush' }]);
    const r = findAction(spec, { x: 0 }, 'canvas', null, false);
    expect(r.type).toBe('none');
  });
});

describe('shouldTriggerWin', () => {
  const spec = { win_condition: 'state.x >= 3', objects: [], actions: [] };
  it('true when not won and condition met', () => expect(shouldTriggerWin(spec, { x: 3 }, false)).toBe(true));
  it('false when already won', () => expect(shouldTriggerWin(spec, { x: 5 }, true)).toBe(false));
  it('false when condition not met', () => expect(shouldTriggerWin(spec, { x: 1 }, false)).toBe(false));
});

describe('gridMajorKey', () => {
  it('returns 0 for multiples of 100', () => expect(gridMajorKey(100)).toBe('0'));
  it('returns 0 for 0', () => expect(gridMajorKey(0)).toBe('0'));
  it('returns 1 for non-multiples of 100', () => expect(gridMajorKey(50)).toBe('1'));
  it('returns 1 for 1', () => expect(gridMajorKey(1)).toBe('1'));
});

describe('CJS module.exports guard', () => {
  it('exposes exactly the same function set via require as via import', () => {
    const names = [
      'evalCond', 'applyStateAction', 'resolveScene', 'resolveImgFit', 'resolveImgSrc',
      'resolveObject', 'objectRenderType', 'resolveAnimName', 'nextSpriteIdx', 'parseAction',
      'findAction', 'shouldTriggerWin', 'gridMajorKey',
    ];
    expect(Object.keys(cjs).sort()).toEqual([...names].sort());
    names.forEach(name => expect(typeof cjs[name]).toBe('function'));
  });
});
