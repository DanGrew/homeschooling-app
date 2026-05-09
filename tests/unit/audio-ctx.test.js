import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { decodeAudioBuffer, unlockAudioCtx } = require('../../ui/shared/audio-ctx.js');

describe('decodeAudioBuffer', () => {
  it('resolves with decoded buffer on success', async () => {
    const decoded = { type: 'AudioBuffer' };
    const ctx = { decodeAudioData: vi.fn((buf, res) => res(decoded)) };
    const result = await decodeAudioBuffer(ctx, new ArrayBuffer(8));
    expect(result).toBe(decoded);
  });

  it('rejects when errorCallback is called', async () => {
    const err = new Error('decode failed');
    const ctx = { decodeAudioData: vi.fn((buf, res, rej) => rej(err)) };
    await expect(decodeAudioBuffer(ctx, new ArrayBuffer(8))).rejects.toBe(err);
  });

  it('passes buffer to decodeAudioData', async () => {
    const ctx = { decodeAudioData: vi.fn((buf, res) => res({})) };
    const buf = new ArrayBuffer(8);
    await decodeAudioBuffer(ctx, buf);
    expect(ctx.decodeAudioData).toHaveBeenCalledWith(buf, expect.any(Function), expect.any(Function));
  });
});

describe('unlockAudioCtx', () => {
  it('creates 1-sample buffer, connects and starts', () => {
    const src = { buffer: null, connect: vi.fn(), start: vi.fn() };
    const fakeBuf = {};
    const ctx = {
      createBuffer: vi.fn(() => fakeBuf),
      createBufferSource: vi.fn(() => src),
      destination: {}
    };
    unlockAudioCtx(ctx);
    expect(ctx.createBuffer).toHaveBeenCalledWith(1, 1, 22050);
    expect(src.buffer).toBe(fakeBuf);
    expect(src.connect).toHaveBeenCalledWith(ctx.destination);
    expect(src.start).toHaveBeenCalledWith(0);
  });
});
