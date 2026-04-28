class SimulatorEngine {
  constructor(spec, container) {
    this.spec = spec;
    this.container = container;
    this.state = Object.assign({}, spec.state);
    this.actorIndices = {};
    this.won = false;
    this._sayTimer = null;
    this.selectedTool = null;
    this.toolEls = {};
  }

  start() {
    this._renderBackground();
    this._renderToolbar();
    this._renderObjects();
    this._renderSpeechBubble();
  }

  _renderBackground() {
    this.container.style.cssText = `position:relative;width:${this.spec.scene.width}px;height:${this.spec.scene.height}px;background:${this.spec.scene.bg_color||'#f0f8e8'};overflow:hidden;border-radius:20px;touch-action:none;`;
  }

  _img(spriteName, fit) {
    const img = document.createElement('img');
    img.src = spriteName.includes('.') ? `sprites/${spriteName}` : `sprites/${spriteName}.png`;
    img.style.cssText = `width:100%;height:100%;object-fit:${fit||'contain'};`;
    return img;
  }

  _renderToolbar() {
    if (!this.spec.toolbar) return;
    const bar = document.createElement('div');
    bar.id = 'toolbar';
    bar.style.cssText = `position:absolute;bottom:0;left:0;width:100%;height:84px;display:flex;align-items:center;justify-content:space-around;background:rgba(255,255,255,0.92);z-index:100;border-top:3px solid #ddd;box-sizing:border-box;padding:0 8px;`;
    this.spec.toolbar.forEach(tool => {
      const btn = document.createElement('div');
      btn.id = `tool-${tool.id}`;
      btn.style.cssText = `width:60px;height:60px;cursor:pointer;border-radius:12px;padding:4px;box-sizing:border-box;transition:background 0.15s,outline 0.15s;flex-shrink:0;`;
      btn.appendChild(this._img(tool.sprite));
      btn.addEventListener('click', () => this._selectTool(tool.id));
      btn.addEventListener('touchend', e => { e.preventDefault(); this._selectTool(tool.id); }, { passive: false });
      bar.appendChild(btn);
      this.toolEls[tool.id] = btn;
    });
    this.container.appendChild(bar);
  }

  _selectTool(toolId) {
    if (this.won) return;
    const prev = this.selectedTool;
    this._clearTool();
    if (prev !== toolId) {
      this.selectedTool = toolId;
      const btn = this.toolEls[toolId];
      if (btn) { btn.style.background = 'rgba(80,200,80,0.35)'; btn.style.outline = '3px solid #4a4'; }
    }
  }

  _clearTool() {
    if (this.selectedTool && this.toolEls[this.selectedTool]) {
      this.toolEls[this.selectedTool].style.background = '';
      this.toolEls[this.selectedTool].style.outline = '';
    }
    this.selectedTool = null;
  }

  _renderObjects() {
    this.spec.objects.forEach((obj, i) => {
      const el = document.createElement('div');
      el.id = `obj-${obj.id}`;
      el.style.cssText = `position:absolute;left:${obj.x}px;top:${obj.y}px;width:${obj.w}px;height:${obj.h}px;transition:transform 0.25s;z-index:${i + 1};`;
      if (obj.visible === false) el.style.display = 'none';
      const spriteName = obj.sprite_states ? obj.sprite_states[0] : obj.sprite;
      el.appendChild(this._img(spriteName, obj.fit));
      if (obj.sprite_states) this.actorIndices[obj.id] = 0;
      if (obj.clickable) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => this._handleTap(obj.id));
        el.addEventListener('touchend', e => { e.preventDefault(); this._handleTap(obj.id); }, { passive: false });
      }
      this.container.appendChild(el);
    });
  }

  _renderSpeechBubble() {
    const b = document.createElement('div');
    b.id = 'speech-bubble';
    const bottom = this.spec.toolbar ? '92px' : '14px';
    b.style.cssText = `position:absolute;bottom:${bottom};left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.95);border-radius:24px;padding:10px 22px;font-family:'Comic Sans MS',cursive;font-size:18px;color:#333;white-space:nowrap;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:200;box-shadow:0 2px 10px rgba(0,0,0,0.15);`;
    this.container.appendChild(b);
  }

  _handleTap(objectId) {
    if (this.won) return;
    if (this.selectedTool) {
      const exactMatch = this.spec.actions.find(a =>
        a.when.tool_tap &&
        a.when.tool_tap.tool === this.selectedTool &&
        a.when.tool_tap.target === objectId &&
        (!a.when.if || this._evalCond(a.when.if))
      );
      if (exactMatch) {
        this._execActions(exactMatch.do);
        this._clearTool();
        this._checkRules();
        this._checkWin();
        return;
      }
      const rightToolWrongStage = this.spec.actions.find(a =>
        a.when.tool_tap &&
        a.when.tool_tap.tool === this.selectedTool &&
        a.when.tool_tap.target === objectId
      );
      if (rightToolWrongStage) { this._say("Not yet — keep going!"); return; }
      const anyToolForTarget = this.spec.actions.find(a =>
        a.when.tool_tap && a.when.tool_tap.target === objectId
      );
      if (anyToolForTarget) { this._say("Try a different tool!"); return; }
    }
    const action = this.spec.actions.find(a =>
      a.when.tap === objectId &&
      (!a.when.if || this._evalCond(a.when.if))
    );
    if (action) {
      this._execActions(action.do);
      this._checkRules();
      this._checkWin();
      return;
    }
    if (this.spec.toolbar) {
      const hasToolAction = this.spec.actions.some(a => a.when.tool_tap && a.when.tool_tap.target === objectId);
      if (hasToolAction) this._say("Pick a tool first!");
    }
  }

  _execActions(actions) { actions.forEach(a => this._exec(a)); }

  _exec(action) {
    const sm = action.match(/^state\.(\w+)\s*(\+=|-=|=)\s*(\d+)$/);
    if (sm) {
      const [, key, op, val] = sm;
      const n = parseInt(val);
      if (op === '+=') this.state[key] += n;
      else if (op === '-=') this.state[key] = Math.max(0, this.state[key] - n);
      else this.state[key] = n;
      return;
    }
    const am = action.match(/^animate:\s*(.+)$/);
    if (am) { this._animate(am[1].trim()); return; }
    const say = action.match(/^say:\s*(.+)$/);
    if (say) { this._say(say[1].trim()); return; }
    const show = action.match(/^show:\s*(\S+)$/);
    if (show) { const el = document.getElementById(`obj-${show[1]}`); if (el) el.style.display = ''; return; }
    const hide = action.match(/^hide:\s*(\S+)$/);
    if (hide) { const el = document.getElementById(`obj-${hide[1]}`); if (el) el.style.display = 'none'; return; }
    const adv = action.match(/^advance_sprite:\s*(\S+)$/);
    if (adv) {
      const id = adv[1];
      const obj = this.spec.objects.find(o => o.id === id);
      const el = document.getElementById(`obj-${id}`);
      if (obj && obj.sprite_states && el) {
        const next = Math.min((this.actorIndices[id] || 0) + 1, obj.sprite_states.length - 1);
        this.actorIndices[id] = next;
        const s = obj.sprite_states[next];
        el.querySelector('img').src = s.includes('.') ? `sprites/${s}` : `sprites/${s}.png`;
      }
      return;
    }
    const mv = action.match(/^move:\s*(\S+)\s+(\d+)\s+(\d+)$/);
    if (mv) { const el = document.getElementById(`obj-${mv[1]}`); if (el) { el.style.left = `${mv[2]}px`; el.style.top = `${mv[3]}px`; } return; }
  }

  _evalCond(cond) {
    if (cond && typeof cond === 'object') {
      if (cond.all) return cond.all.every(c => this._evalCond(c));
      if (cond.any) return cond.any.some(c => this._evalCond(c));
    }
    const m = String(cond).match(/^state\.(\w+)\s*(>=|==|<=|>|<)\s*(\d+)$/);
    if (!m) return false;
    const [, key, op, val] = m;
    const a = this.state[key], b = parseInt(val);
    if (op === '>=') return a >= b;
    if (op === '==') return a == b;
    if (op === '<=') return a <= b;
    if (op === '>') return a > b;
    if (op === '<') return a < b;
    return false;
  }

  _checkRules() { this.spec.rules.forEach(rule => { if (this._evalCond(rule.if)) this._execActions(rule.do); }); }

  _checkWin() {
    if (!this.won && this._evalCond(this.spec.win_condition)) {
      this.won = true;
      this._execActions(this.spec.win_response);
    }
  }

  _animate(spec) {
    const [name, targetId] = spec.trim().split(/\s+/);
    const el = targetId ? document.getElementById(`obj-${targetId}`) : null;

    if (name === 'grow' && el) {
      const obj = this.spec.objects.find(o => o.id === targetId);
      if (obj && obj.sprite_states) {
        const next = Math.min(this.actorIndices[targetId] + 1, obj.sprite_states.length - 1);
        this.actorIndices[targetId] = next;
        const s = obj.sprite_states[next];
        el.querySelector('img').src = s.includes('.') ? `sprites/${s}` : `sprites/${s}.png`;
        el.style.transform = 'scale(1.18)';
        setTimeout(() => el.style.transform = 'scale(1)', 280);
      }
      return;
    }

    if (name === 'splash' && el) {
      const sw = Math.round(el.offsetWidth / 4);
      const sh = Math.round(el.offsetHeight / 4);
      const cx = el.offsetLeft + el.offsetWidth / 2;
      const cy = el.offsetTop + el.offsetHeight / 2;
      const pop = (ox, oy, delay) => {
        setTimeout(() => {
          const img = document.createElement('img');
          img.src = 'sprites/splash.png';
          img.style.cssText = `position:absolute;left:${cx + ox - sw/2}px;top:${cy + oy - sh/2}px;width:${sw}px;height:${sh}px;object-fit:contain;pointer-events:none;z-index:50;transition:opacity 0.25s;`;
          this.container.appendChild(img);
          setTimeout(() => img.style.opacity = '0', 280);
          setTimeout(() => img.remove(), 550);
        }, delay);
      };
      pop(-35, -45, 0);
      pop(30, 40, 320);
      return;
    }

    if (name === 'glow' && el) {
      const img = el.querySelector('img');
      img.style.transition = 'filter 0.2s';
      img.style.filter = 'sepia(1) brightness(1.4) saturate(4) hue-rotate(-10deg)';
      setTimeout(() => { img.style.filter = ''; }, 800);
      return;
    }

    if (name === 'celebrate' && el) {
      let count = 0;
      const bounce = setInterval(() => {
        el.style.transform = count % 2 === 0 ? 'scale(1.25) rotate(8deg)' : 'scale(1.25) rotate(-8deg)';
        if (++count >= 6) { clearInterval(bounce); el.style.transform = 'scale(1)'; }
      }, 150);
      return;
    }

    if (el) {
      el.style.transform = name === 'shine' ? 'rotate(20deg) scale(1.15)' : 'translateY(-8px)';
      setTimeout(() => el.style.transform = '', 350);
    }
  }

  _say(text) {
    const b = document.getElementById('speech-bubble');
    if (!b) return;
    b.textContent = text;
    b.style.opacity = '1';
    clearTimeout(this._sayTimer);
    this._sayTimer = setTimeout(() => b.style.opacity = '0', 2500);
  }
}
