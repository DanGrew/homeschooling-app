import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { once } = require('../../core/shared/utils.js');

describe('once', () => {
  it('calls fn only on first invocation', () => {
    let calls = 0;
    const f = once(() => { calls++; return 42; });
    f(); f(); f();
    expect(calls).toBe(1);
  });

  it('returns same value on every call', () => {
    const f = once(() => ({ x: 1 }));
    expect(f()).toBe(f());
  });

  it('returns the fn return value', () => {
    expect(once(() => 99)()).toBe(99);
  });

  it('returns Promise.reject when fn throws', async () => {
    const err = new Error('boom');
    const f = once(() => { throw err; });
    await expect(f()).rejects.toBe(err);
  });

  it('subsequent calls after throw return same rejected promise', async () => {
    const f = once(() => { throw new Error('boom'); });
    const r1 = f();
    const r2 = f();
    expect(r1).toBe(r2);
    await expect(r1).rejects.toThrow();
  });
});
