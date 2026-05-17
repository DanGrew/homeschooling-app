import { describe, it, expect, vi, beforeEach } from 'vitest';

function makeStore(events) {
  return {
    add: vi.fn(),
    getAll: vi.fn(() => {
      const req = {};
      setTimeout(() => { req.onsuccess && req.onsuccess({ target: { result: events } }); }, 0);
      return req;
    })
  };
}

function makeDb(events) {
  return {
    objectStoreNames: { contains: vi.fn(() => true) },
    transaction: vi.fn(() => ({ objectStore: vi.fn(() => makeStore(events)) }))
  };
}

function makeOpenRequest(db) {
  const req = {};
  setTimeout(() => {
    req.onupgradeneeded && req.onupgradeneeded({ target: { result: db } });
    req.onsuccess && req.onsuccess({ target: { result: db } });
  }, 0);
  return req;
}

beforeEach(() => {
  vi.resetModules();
  delete global.indexedDB;
});

describe('saveEvent', () => {
  it('does not throw when indexedDB is unavailable', async () => {
    const { saveEvent } = await import('../../core/telemetry/learning-db.js');
    expect(() => saveEvent({ id: '1', type: 'test' })).not.toThrow();
  });

  it('calls objectStore.add when indexedDB is available', async () => {
    const db = makeDb([]);
    const addSpy = vi.fn();
    db.transaction = vi.fn(() => ({ objectStore: vi.fn(() => ({ add: addSpy })) }));
    global.indexedDB = { open: vi.fn(() => makeOpenRequest(db)) };
    const { saveEvent } = await import('../../core/telemetry/learning-db.js');
    saveEvent({ id: '1', type: 'test' });
    await new Promise(r => setTimeout(r, 50));
    expect(addSpy).toHaveBeenCalledWith({ id: '1', type: 'test' });
  });
});

describe('getAllEvents', () => {
  it('calls back with empty array when indexedDB is unavailable', async () => {
    const { getAllEvents } = await import('../../core/telemetry/learning-db.js');
    const cb = vi.fn();
    getAllEvents(cb);
    await new Promise(r => setTimeout(r, 50));
    expect(cb).toHaveBeenCalledWith([]);
  });

  it('calls back with stored events when indexedDB is available', async () => {
    const stored = [{ id: '1', type: 'lesson_completed' }];
    const db = makeDb(stored);
    global.indexedDB = { open: vi.fn(() => makeOpenRequest(db)) };
    const { getAllEvents } = await import('../../core/telemetry/learning-db.js');
    const cb = vi.fn();
    getAllEvents(cb);
    await new Promise(r => setTimeout(r, 50));
    expect(cb).toHaveBeenCalledWith(stored);
  });
});
