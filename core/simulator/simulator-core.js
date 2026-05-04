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
  if (op === '<') return a < b;
  return false;
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
