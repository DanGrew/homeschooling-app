class SimulatorEngine {
  constructor(spec, container) {
    this.spec = spec;
    this.container = container;
    this.state = Object.assign({}, spec.state);
    this.actorIndices = {};
    this.won = false;
    this._sayTimer = null;
  }

  start() {
    this._renderBackground();
    this._renderObjects();
    this._renderSpeechBubble();
  }

  _renderBackground() {
    this.container.style.cssText = `position:relative;width:${this.spec.scene.width}px;height:${this.spec.scene.height}px;background:#f0f8e8;overflow:hidden;border-radius:20px;touch-action:none;`;
  }

  _img(spriteName) {
    const img = document.createElement('img');
    img.src = `sprites/${spriteName}.png`;
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
    return img;
  }

  _renderObjects() {
    this.spec.objects.forEach(obj => {
      const el = document.createElement('div');
      el.id = `obj-${obj.id}`;
      el.style.cssText = `position:absolute;left:${obj.x}px;top:${obj.y}px;width:${obj.w}px;height:${obj.h}px;transition:transform 0.25s;`;
      if (obj.sprite_states) {
        this.actorIndices[obj.id] = 0;
        el.appendChild(this._img(obj.sprite_states[0]));
      } else {
        el.appendChild(this._img(obj.sprite));
      }
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
    b.style.cssText = `position:absolute;bottom:14px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.95);border-radius:24px;padding:10px 22px;font-family:'Comic Sans MS',cursive;font-size:18px;color:#333;white-space:nowrap;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:10;box-shadow:0 2px 10px rgba(0,0,0,0.15);`;
    this.container.appendChild(b);
  }

  _handleTap(objectId) {
    if (this.won) return;
    const action = this.spec.actions.find(a => a.when.tap === objectId);
    if (action) this._execActions(action.do);
    this._checkRules();
    this._checkWin();
  }

  _execActions(actions) {
    actions.forEach(a => this._exec(a));
  }

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

  _checkRules() {
    this.spec.rules.forEach(rule => {
      if (this._evalCond(rule.if)) this._execActions(rule.do);
    });
  }

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
        el.querySelector('img').src = `sprites/${obj.sprite_states[next]}.png`;
        el.style.transform = 'scale(1.18)';
        setTimeout(() => el.style.transform = 'scale(1)', 280);
      }
      return;
    }

    if (name === 'splash' && el) {
      const overlay = document.createElement('img');
      overlay.src = 'sprites/splash.png';
      overlay.style.cssText = `position:absolute;left:${el.offsetLeft - 10}px;top:${el.offsetTop - 20}px;width:${el.offsetWidth + 20}px;height:${el.offsetHeight + 20}px;object-fit:contain;pointer-events:none;z-index:5;transition:opacity 0.3s;`;
      this.container.appendChild(overlay);
      setTimeout(() => overlay.style.opacity = '0', 300);
      setTimeout(() => overlay.remove(), 650);
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
