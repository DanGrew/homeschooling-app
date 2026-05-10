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
    setTimeout(function() { engine._execActions(engine.spec.win_response); }, 300);
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
    var origBorder = el.style.border;
    el.style.transition = 'none';
    el.style.border = '3px solid #e53935';
    el.style.boxShadow = '0 0 0 4px rgba(229,57,53,0.35)';
    ['translateX(-7px)', 'translateX(7px)', 'translateX(-6px)', 'translateX(6px)', 'translateX(0)'].forEach(function(t, i) {
      setTimeout(function() { el.style.transform = t; }, i * 80);
    });
    setTimeout(function() {
      el.style.border = origBorder;
      el.style.boxShadow = '';
      el.style.transition = '';
    }, 700);
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
  flip_x: function(args, engine) {
    var el = document.getElementById('obj-' + args[0]);
    if (!el) return;
    var flipped = el.dataset.flipped === '1';
    el.dataset.flipped = flipped ? '0' : '1';
    el.style.transform = flipped ? '' : 'scaleX(-1)';
  },
  splash_at: function(args, engine) {
    var cx = parseInt(args[0]), cy = parseInt(args[1]), sw = 80, sh = 80;
    [[-35, -45, 0], [30, 40, 320]].forEach(function(offset) {
      setTimeout(function() {
        var img = document.createElement('img');
        img.src = resolveImgSrc(engine.spritesPath, 'splash.png');
        img.style.cssText = 'position:absolute;left:' + (cx + offset[0] - sw/2) + 'px;top:' + (cy + offset[1] - sh/2) + 'px;width:' + sw + 'px;height:' + sh + 'px;object-fit:contain;pointer-events:none;z-index:50;transition:opacity 0.25s;';
        engine.container.appendChild(img);
        setTimeout(function() { img.style.opacity = '0'; }, 280);
        setTimeout(function() { img.remove(); }, 550);
      }, offset[2]);
    });
  },
  delay: function(args, engine) {
    setTimeout(function() { engine._exec(args[1]); }, args[0]);
  },
  show_tray: function(args, engine) { engine._showTray(args); },
  hide_tray: function(args, engine) { engine._hideTray(); },
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
    document.addEventListener('keydown', (e) => { if (e.key === 'g' || e.key === 'G') this._toggleGrid(); });
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
      el.style.cssText = 'position:absolute;left:' + obj.x + 'px;top:' + obj.y + 'px;width:' + obj.w + 'px;height:' + obj.h + 'px;transition:transform 0.25s;z-index:' + (robj.clickable ? 50 + i : i + 1) + ';';
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

  _toggleGrid() {
    var existing = document.getElementById('debug-grid');
    if (existing) { existing.remove(); return; }
    var w = this.spec.scene.width, h = this.spec.scene.height, step = 50;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'debug-grid';
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    for (var x = 0; x <= w; x += step) {
      var vl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vl.setAttribute('x1', x); vl.setAttribute('y1', 0); vl.setAttribute('x2', x); vl.setAttribute('y2', h);
      vl.setAttribute('stroke', x % 100 === 0 ? 'rgba(255,0,0,0.5)' : 'rgba(255,0,0,0.2)');
      vl.setAttribute('stroke-width', x % 100 === 0 ? '1' : '0.5');
      svg.appendChild(vl);
    }
    for (var y = 0; y <= h; y += step) {
      var hl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hl.setAttribute('x1', 0); hl.setAttribute('y1', y); hl.setAttribute('x2', w); hl.setAttribute('y2', y);
      hl.setAttribute('stroke', y % 100 === 0 ? 'rgba(255,0,0,0.5)' : 'rgba(255,0,0,0.2)');
      hl.setAttribute('stroke-width', y % 100 === 0 ? '1' : '0.5');
      svg.appendChild(hl);
    }
    for (var lx = 0; lx <= w; lx += 100) {
      for (var ly = 0; ly <= h; ly += 100) {
        var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', lx + 2); t.setAttribute('y', ly + 10);
        t.setAttribute('fill', 'rgba(200,0,0,0.85)'); t.setAttribute('font-size', '11'); t.setAttribute('font-family', 'monospace');
        t.textContent = lx + ',' + ly;
        svg.appendChild(t);
      }
    }
    this.spec.objects.forEach(obj => {
      var el = document.getElementById('obj-' + obj.id);
      if (!el) return;
      var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', obj.x); rect.setAttribute('y', obj.y);
      rect.setAttribute('width', obj.w); rect.setAttribute('height', obj.h);
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', '#00cc44'); rect.setAttribute('stroke-width', '1.5');
      var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', obj.x + 2); label.setAttribute('y', obj.y + 11);
      label.setAttribute('fill', '#00cc44'); label.setAttribute('font-size', '10'); label.setAttribute('font-family', 'monospace');
      label.textContent = obj.id;
      svg.appendChild(rect);
      svg.appendChild(label);
    });
    this.container.appendChild(svg);
  }

  _showTray(objectIds) {
    this._hideTray(true);
    var tray = document.createElement('div');
    tray.id = 'choice-tray';
    tray.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;background:#fff;border-radius:20px 20px 0 0;padding:16px 12px 20px;box-shadow:0 -4px 20px rgba(0,0,0,0.15);transform:translateY(100%);transition:transform 0.3s ease-out;z-index:200;box-sizing:border-box;';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:16px;justify-content:center;';
    objectIds.forEach(id => {
      var obj = this.spec.objects.find(o => o.id === id);
      if (!obj) return;
      var tile = document.createElement('div');
      tile.id = 'obj-' + id;
      tile.style.cssText = 'border:2px solid #ddd;border-radius:16px;padding:10px 8px 8px;width:150px;text-align:center;cursor:pointer;box-sizing:border-box;flex-shrink:0;transition:border-color 0.15s;';
      var img = document.createElement('img');
      img.src = resolveImgSrc(this.spritesPath, obj.sprite);
      img.style.cssText = 'width:100%;height:110px;object-fit:contain;display:block;';
      var label = document.createElement('div');
      label.textContent = obj.label || '';
      label.style.cssText = 'font-size:16px;font-weight:bold;color:#444;margin-top:6px;font-family:inherit;';
      tile.appendChild(img);
      tile.appendChild(label);
      var handler = () => {
        tile.style.transform = 'scale(0.93)';
        setTimeout(() => { tile.style.transform = ''; }, 150);
        var peek = findAction(this.spec, this.state, id, this.selectedTool, this.won);
        if (peek.type === 'exec') {
          var isWrong = peek.actions.some(a => a.startsWith('animate: shake'));
          tile.style.border = isWrong ? '4px solid #e53935' : '4px solid #4CAF50';
        }
        setTimeout(() => { this._handleTap(id); }, 400);
      };
      tile.addEventListener('click', handler);
      tile.addEventListener('touchend', function(e) { e.preventDefault(); handler(); }, { passive: false });
      row.appendChild(tile);
    });
    tray.appendChild(row);
    this.container.appendChild(tray);
    requestAnimationFrame(() => requestAnimationFrame(() => { tray.style.transform = 'translateY(0)'; }));
  }

  _hideTray(immediate) {
    var tray = document.getElementById('choice-tray');
    if (!tray) return;
    if (immediate) { tray.remove(); return; }
    tray.style.transform = 'translateY(100%)';
    setTimeout(() => tray.remove(), 350);
  }

  _reset() {
    this._hideTray(true);
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
