import {
  evalCond, applyStateAction, resolveScene, resolveImgFit, resolveImgSrc, resolveObject,
  objectRenderType, resolveAnimName, nextSpriteIdx, parseAction, findAction, shouldTriggerWin,
} from '../../core/simulator/simulator-core.js';

var DISPLAY = { 'true': '', 'false': 'none' };

var BOUNCE_FRAMES = [
  'scale(1.25) rotate(8deg)', 'scale(1.25) rotate(-8deg)',
  'scale(1.25) rotate(8deg)', 'scale(1.25) rotate(-8deg)',
  'scale(1.25) rotate(8deg)', 'scale(1.25) rotate(-8deg)',
  'scale(1)',
];

var RULE_EXEC = {
  'true': function(rule, engine) { engine._execActions(rule.do); },
  'false': function() {},
};

var TRIGGER_WIN = {
  'true': function(engine) {
    engine.won = true;
    setTimeout(function() { engine._execActions(engine.spec.win_response); }, 2500);
  },
  'false': function() {},
};

var CLEAR_TOOL_ON_EXEC = {
  'true': function(engine) { engine._clearTool(); },
  'false': function() {},
};

var HANDLE_RESULT = {
  exec: function(result, engine) {
    engine._execActions(result.actions);
    CLEAR_TOOL_ON_EXEC[String(result.clearTool)](engine);
    engine._checkRules();
    engine._checkWin();
  },
  say: function(result, engine) { engine._say(result.text); },
  none: function() {},
};

var RESET_SPRITE = {
  'true': function(el, obj, engine) {
    engine.actorIndices[obj.id] = 0;
    var sprite = obj.sprite_states[0];
    [el.querySelector('img')].filter(Boolean).forEach(function(img) {
      img.src = resolveImgSrc(engine.spritesPath, sprite);
    });
  },
  'false': function() {},
};

var OBJ_RENDERERS = {
  button: function(el, obj, engine) {
    var btn = document.createElement('div');
    btn.textContent = obj.label;
    btn.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#4CAF50;color:#fff;font-family:inherit;font-size:18px;font-weight:bold;border-radius:32px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,0.25);text-align:center;padding:0 12px;box-sizing:border-box;pointer-events:none;';
    el.appendChild(btn);
  },
  sprite_states: function(el, obj, engine) {
    engine.actorIndices[obj.id] = 0;
    el.appendChild(engine._img(obj.sprite_states[0], obj.fit));
  },
  sprite: function(el, obj, engine) {
    el.appendChild(engine._img(obj.sprite, obj.fit));
  },
};

var MAKE_CLICKABLE = {
  'true': function(el, obj, engine) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function() { engine._handleTap(obj.id); });
    el.addEventListener('touchend', function(e) { e.preventDefault(); engine._handleTap(obj.id); }, { passive: false });
  },
  'false': function() {},
};

var APPLY_TOOL = {
  'true': function(toolId, engine) {
    engine.selectedTool = toolId;
    engine.toolEls[toolId]?.style.setProperty('background', 'rgba(80,200,80,0.35)');
    engine.toolEls[toolId]?.style.setProperty('outline', '3px solid #4a4');
  },
  'false': function() {},
};

var SELECT_TOOL_ACTIVE = {
  'true': function(toolId, engine) {
    var prev = engine.selectedTool;
    engine._clearTool();
    APPLY_TOOL[String(prev !== toolId)](toolId, engine);
  },
  'false': function() {},
};

var RENDER_TOOLBAR = {
  'true': function(engine) {
    var bar = document.createElement('div');
    bar.id = 'toolbar';
    bar.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;height:96px;display:flex;align-items:center;justify-content:space-around;background:rgba(255,255,255,0.92);z-index:100;border-top:3px solid #ddd;box-sizing:border-box;padding:0 8px;';
    engine.spec.toolbar.forEach(function(tool) {
      var btn = document.createElement('div');
      btn.id = 'tool-' + tool.id;
      btn.style.cssText = 'width:72px;height:72px;cursor:pointer;border-radius:12px;padding:4px;box-sizing:border-box;transition:background 0.15s,outline 0.15s;flex-shrink:0;';
      btn.style.display = DISPLAY[String(tool.visible !== false)];
      btn.appendChild(engine._img(tool.sprite));
      btn.addEventListener('click', function() { engine._selectTool(tool.id); });
      btn.addEventListener('touchend', function(e) { e.preventDefault(); engine._selectTool(tool.id); }, { passive: false });
      bar.appendChild(btn);
      engine.toolEls[tool.id] = btn;
    });
    engine.container.appendChild(bar);
  },
  'false': function() {},
};

var ANIMATORS = {
  grow: function(el, engine, targetId) {
    var obj = engine.spec.objects.find(function(o) { return o.id === targetId; });
    var newIdx = nextSpriteIdx(obj?.sprite_states, engine.actorIndices[targetId], 1);
    engine.actorIndices[targetId] = newIdx;
    [obj?.sprite_states?.[newIdx]].filter(Boolean).forEach(function(sprite) {
      [el.querySelector('img')].filter(Boolean).forEach(function(img) {
        img.src = resolveImgSrc(engine.spritesPath, sprite);
      });
    });
    el.style.transform = 'scale(1.18)';
    setTimeout(function() { el.style.transform = 'scale(1)'; }, 280);
  },
  splash: function(el, engine) {
    var sw = Math.round(el.offsetWidth / 4);
    var sh = Math.round(el.offsetHeight / 4);
    var cx = el.offsetLeft + el.offsetWidth / 2;
    var cy = el.offsetTop + el.offsetHeight / 2;
    [[-35, -45, 0], [30, 40, 320]].forEach(function(offset) {
      var ox = offset[0], oy = offset[1], delay = offset[2];
      setTimeout(function() {
        var img = document.createElement('img');
        img.src = resolveImgSrc(engine.spritesPath, 'splash.png');
        img.style.cssText = 'position:absolute;left:' + (cx + ox - sw/2) + 'px;top:' + (cy + oy - sh/2) + 'px;width:' + sw + 'px;height:' + sh + 'px;object-fit:contain;pointer-events:none;z-index:50;transition:opacity 0.25s;';
        engine.container.appendChild(img);
        setTimeout(function() { img.style.opacity = '0'; }, 280);
        setTimeout(function() { img.remove(); }, 550);
      }, delay);
    });
  },
  glow: function(el, engine) {
    [el.querySelector('img')].filter(Boolean).forEach(function(img) {
      img.style.transition = 'filter 0.2s';
      img.style.filter = 'sepia(1) brightness(1.4) saturate(4) hue-rotate(-10deg)';
      setTimeout(function() { img.style.filter = ''; }, 800);
    });
  },
  dirt: function(el, engine) {
    var sz = 80;
    var cx = el.offsetLeft + el.offsetWidth / 2 - sz / 2;
    var startY = el.offsetTop + el.offsetHeight / 2 - sz * 1.5;
    var endY = el.offsetTop + el.offsetHeight / 2 - sz / 2;
    var img = document.createElement('img');
    img.src = resolveImgSrc(engine.spritesPath, 'dirt-falling.png');
    img.style.cssText = 'position:absolute;left:' + cx + 'px;top:' + startY + 'px;width:' + sz + 'px;height:' + sz + 'px;object-fit:contain;pointer-events:none;z-index:50;transition:top 0.35s ease-in;';
    engine.container.appendChild(img);
    requestAnimationFrame(function() { requestAnimationFrame(function() { img.style.top = endY + 'px'; }); });
    setTimeout(function() { img.style.transition += ',opacity 0.25s'; img.style.opacity = '0'; }, 400);
    setTimeout(function() { img.remove(); }, 700);
  },
  celebrate: function(el, engine) {
    [0, 1, 2, 3, 4, 5].forEach(function(i) {
      setTimeout(function() { el.style.transform = BOUNCE_FRAMES[i]; }, 150 * i);
    });
    setTimeout(function() { el.style.transform = 'scale(1)'; }, 150 * 6);
  },
  shine: function(el, engine) {
    el.style.transform = 'rotate(20deg) scale(1.15)';
    setTimeout(function() { el.style.transform = ''; }, 350);
  },
  shake: function(el, engine) {
    el.style.transition = 'none';
    el.style.outline = '3px solid #e53935';
    ['translateX(-6px)', 'translateX(6px)', 'translateX(-5px)', 'translateX(5px)', 'translateX(0)'].forEach(function(t, i) {
      setTimeout(function() { el.style.transform = t; }, i * 70);
    });
    setTimeout(function() { el.style.outline = ''; el.style.transition = ''; }, 420);
  },
  _default: function(el, engine) {
    el.style.transform = 'translateY(-8px)';
    setTimeout(function() { el.style.transform = ''; }, 350);
  },
};

var EXEC_HANDLERS = {
  noop: function() {},
  reset: function(args, engine) { engine._reset(); },
  state: function(args, engine) { applyStateAction(engine.state, args[0]); },
  animate: function(args, engine) { engine._animate(args[0]); },
  say: function(args, engine) { engine._say(args[0]); },
  show: function(args, engine) {
    [document.getElementById('obj-' + args[0])].filter(Boolean).forEach(function(el) { el.style.display = ''; });
  },
  hide: function(args, engine) {
    [document.getElementById('obj-' + args[0])].filter(Boolean).forEach(function(el) { el.style.display = 'none'; });
  },
  fade_in: function(args, engine) {
    [document.getElementById('obj-' + args[0])].filter(Boolean).forEach(function(el) {
      el.style.opacity = '0';
      el.style.display = '';
      el.style.transition = 'opacity ' + args[1] + 'ms';
      requestAnimationFrame(function() { requestAnimationFrame(function() { el.style.opacity = '1'; }); });
    });
  },
  fade_out: function(args, engine) {
    var dur = args[1];
    [document.getElementById('obj-' + args[0])].filter(Boolean).forEach(function(el) {
      el.style.transition = 'opacity ' + dur + 'ms';
      el.style.opacity = '0';
      setTimeout(function() { el.style.display = 'none'; el.style.opacity = ''; el.style.transition = ''; }, dur);
    });
  },
  show_tool: function(args, engine) {
    [document.getElementById('tool-' + args[0])].filter(Boolean).forEach(function(btn) { btn.style.display = ''; });
  },
  hide_tool: function(args, engine) {
    [document.getElementById('tool-' + args[0])].filter(Boolean).forEach(function(btn) { btn.style.display = 'none'; });
  },
  set_sprite: function(args, engine) {
    var id = args[0], idx = args[1];
    var obj = engine.spec.objects.find(function(o) { return o.id === id; });
    var newIdx = nextSpriteIdx(obj?.sprite_states, 0, idx);
    engine.actorIndices[id] = newIdx;
    [obj?.sprite_states?.[newIdx]].filter(Boolean).forEach(function(sprite) {
      [document.getElementById('obj-' + id)?.querySelector('img')].filter(Boolean).forEach(function(img) {
        img.src = resolveImgSrc(engine.spritesPath, sprite);
      });
    });
  },
  advance_sprite: function(args, engine) {
    var id = args[0];
    var obj = engine.spec.objects.find(function(o) { return o.id === id; });
    var newIdx = nextSpriteIdx(obj?.sprite_states, engine.actorIndices[id], 1);
    engine.actorIndices[id] = newIdx;
    [obj?.sprite_states?.[newIdx]].filter(Boolean).forEach(function(sprite) {
      [document.getElementById('obj-' + id)?.querySelector('img')].filter(Boolean).forEach(function(img) {
        img.src = resolveImgSrc(engine.spritesPath, sprite);
      });
    });
  },
  move: function(args, engine) {
    [document.getElementById('obj-' + args[0])].filter(Boolean).forEach(function(el) {
      el.style.left = args[1] + 'px';
      el.style.top = args[2] + 'px';
    });
  },
  delay: function(args, engine) {
    setTimeout(function() { engine._exec(args[1]); }, args[0]);
  },
};

export class SimulatorEngine {
  constructor(spec, container) {
    this.spec = spec;
    this.container = container;
    this.state = Object.assign({}, spec.state);
    this.actorIndices = {};
    this.won = false;
    this._sayTimer = null;
    this.selectedTool = null;
    this.toolEls = {};
    var resolved = resolveScene(spec.scene);
    this.spritesPath = resolved.spritesPath;
    this.bgColor = resolved.bgColor;
  }

  start() {
    this._renderBackground();
    this._renderToolbar();
    this._renderObjects();
    this._renderSpeechBubble();
  }

  _renderBackground() {
    this.container.style.cssText = 'position:relative;width:' + this.spec.scene.width + 'px;height:' + this.spec.scene.height + 'px;background:' + this.bgColor + ';overflow:hidden;border-radius:20px;touch-action:none;';
  }

  _img(spriteName, fit) {
    var img = document.createElement('img');
    img.src = resolveImgSrc(this.spritesPath, spriteName);
    img.style.cssText = 'width:100%;height:100%;object-fit:' + resolveImgFit(fit) + ';';
    return img;
  }

  _renderToolbar() {
    RENDER_TOOLBAR[String(!!this.spec.toolbar)](this);
  }

  _selectTool(toolId) {
    SELECT_TOOL_ACTIVE[String(!this.won)](toolId, this);
  }

  _clearTool() {
    this.toolEls[this.selectedTool]?.style.setProperty('background', '');
    this.toolEls[this.selectedTool]?.style.setProperty('outline', '');
    this.selectedTool = null;
  }

  _renderObjects() {
    this.spec.objects.forEach((obj, i) => {
      var robj = resolveObject(obj);
      var el = document.createElement('div');
      el.id = 'obj-' + obj.id;
      el.style.cssText = 'position:absolute;left:' + obj.x + 'px;top:' + obj.y + 'px;width:' + obj.w + 'px;height:' + obj.h + 'px;transition:transform 0.25s;z-index:' + (i + 1) + ';';
      el.style.display = DISPLAY[String(robj.visible)];
      OBJ_RENDERERS[objectRenderType(obj)](el, robj, this);
      MAKE_CLICKABLE[String(robj.clickable)](el, robj, this);
      if (obj.pulse) el.classList.add('speakable--pulse');
      this.container.appendChild(el);
    });
  }

  _renderSpeechBubble() {
    var b = document.createElement('div');
    b.id = 'speech-bubble';
    b.style.cssText = 'position:absolute;top:14px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.95);border-radius:24px;padding:12px 28px;font-family:inherit;font-size:24px;color:#333;white-space:nowrap;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:200;box-shadow:0 2px 10px rgba(0,0,0,0.15);';
    this.container.appendChild(b);
  }

  _handleTap(objectId) {
    var result = findAction(this.spec, this.state, objectId, this.selectedTool, this.won);
    HANDLE_RESULT[result.type](result, this);
  }

  _execActions(actions) { actions.forEach(a => this._exec(a)); }

  _exec(action) {
    var parsed = parseAction(action);
    EXEC_HANDLERS[parsed.type](parsed.args, this);
  }

  _reset() {
    this.won = false;
    this.state = Object.assign({}, this.spec.state);
    this.actorIndices = {};
    this._clearTool();
    this.spec.objects.forEach(obj => {
      [document.getElementById('obj-' + obj.id)].filter(Boolean).forEach(el => {
        el.style.display = DISPLAY[String(obj.visible !== false)];
        el.style.opacity = '';
        el.style.transition = '';
        el.style.transform = '';
        RESET_SPRITE[String(!!obj.sprite_states)](el, obj, this);
      });
    });
    this.spec.toolbar?.forEach(tool => {
      [document.getElementById('tool-' + tool.id)].filter(Boolean).forEach(btn => {
        btn.style.display = DISPLAY[String(tool.visible !== false)];
      });
    });
    [document.getElementById('speech-bubble')].filter(Boolean).forEach(b => {
      b.style.opacity = '0';
    });
  }

  _evalCond(cond) { return evalCond(this.state, cond); }

  _checkRules() {
    this.spec.rules?.forEach(rule => {
      RULE_EXEC[String(evalCond(this.state, rule.if))](rule, this);
    });
  }

  _checkWin() {
    TRIGGER_WIN[String(shouldTriggerWin(this.spec, this.state, this.won))](this);
  }

  _animate(spec) {
    var parts = spec.trim().split(/\s+/);
    var name = parts[0], targetId = parts[1];
    [document.getElementById('obj-' + targetId)].filter(Boolean).forEach(el => {
      ANIMATORS[resolveAnimName(name)](el, this, targetId);
    });
  }

  _say(text) {
    [document.getElementById('speech-bubble')].filter(Boolean).forEach(b => {
      b.textContent = text;
      b.style.opacity = '1';
      clearTimeout(this._sayTimer);
      this._sayTimer = setTimeout(function() { b.style.opacity = '0'; }, 4500);
    });
  }
}
