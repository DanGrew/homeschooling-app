import { createPaginatorState } from '../../core/pagination/paginator-core.js';

const items = (n) => Array.from({ length: n }, (_, i) => `item${i}`);

describe('createPaginatorState — page-based, no wrap', () => {
  var state;
  beforeEach(() => { state = createPaginatorState({ items: items(25), perPage: 10, wrap: false }); });

  it('starts at page 0', () => { expect(state.getPage()).toBe(0); });
  it('calculates correct page count', () => { expect(state.getPageCount()).toBe(3); });
  it('isAtStart true on first page', () => { expect(state.isAtStart()).toBe(true); });
  it('isAtEnd false on first page', () => { expect(state.isAtEnd()).toBe(false); });

  it('next advances page', () => {
    state.next();
    expect(state.getPage()).toBe(1);
  });

  it('prev at start stays at 0', () => {
    state.prev();
    expect(state.getPage()).toBe(0);
  });

  it('next at last page clamps', () => {
    state.next(); state.next(); state.next();
    expect(state.getPage()).toBe(2);
  });

  it('isAtEnd true on last page', () => {
    state.next(); state.next();
    expect(state.isAtEnd()).toBe(true);
  });

  it('getSlice returns correct items for page 0', () => {
    expect(state.getSlice()).toEqual(items(25).slice(0, 10));
  });

  it('getSlice returns correct items for page 1', () => {
    state.next();
    expect(state.getSlice()).toEqual(items(25).slice(10, 20));
  });

  it('getSlice returns remainder on last page', () => {
    state.next(); state.next();
    expect(state.getSlice()).toEqual(items(25).slice(20));
  });
});

describe('createPaginatorState — single item, wrap', () => {
  var state;
  beforeEach(() => { state = createPaginatorState({ items: items(3), perPage: 1, wrap: true }); });

  it('getSlice returns single item not array', () => { expect(state.getSlice()).toBe('item0'); });

  it('next wraps from last to first', () => {
    state.next(); state.next(); state.next();
    expect(state.getPage()).toBe(0);
  });

  it('prev wraps from first to last', () => {
    state.prev();
    expect(state.getPage()).toBe(2);
  });

  it('isAtStart/isAtEnd always accurate', () => {
    expect(state.isAtStart()).toBe(true);
    state.next();
    expect(state.isAtStart()).toBe(false);
    state.next();
    expect(state.isAtEnd()).toBe(true);
  });
});

describe('createPaginatorState — goTo', () => {
  it('goTo jumps to given page (clamp)', () => {
    var state = createPaginatorState({ items: items(10), perPage: 2, wrap: false });
    state.goTo(3);
    expect(state.getPage()).toBe(3);
  });

  it('goTo clamps to last page when beyond range (clamp mode)', () => {
    var state = createPaginatorState({ items: items(10), perPage: 2, wrap: false });
    state.goTo(99);
    expect(state.getPage()).toBe(4);
  });

  it('goTo wraps negative index (wrap mode)', () => {
    var state = createPaginatorState({ items: items(6), perPage: 1, wrap: true });
    state.goTo(-1);
    expect(state.getPage()).toBe(5);
  });

  it('goTo wraps beyond last (wrap mode)', () => {
    var state = createPaginatorState({ items: items(6), perPage: 1, wrap: true });
    state.goTo(7);
    expect(state.getPage()).toBe(1);
  });
});

describe('createPaginatorState — reset', () => {
  it('reset resets to page 0 with new items', () => {
    var state = createPaginatorState({ items: items(10), perPage: 5 });
    state.next();
    state.reset(items(3));
    expect(state.getPage()).toBe(0);
    expect(state.getPageCount()).toBe(1);
    expect(state.getSlice()).toEqual(items(3).slice(0, 5));
  });

  it('reset with empty array gives pageCount 1', () => {
    var state = createPaginatorState({ items: items(5), perPage: 2 });
    state.reset([]);
    expect(state.getPageCount()).toBe(1);
  });
});

describe('createPaginatorState — edge cases', () => {
  it('empty items, pageCount is 1', () => {
    var state = createPaginatorState({ items: [], perPage: 5 });
    expect(state.getPageCount()).toBe(1);
  });

  it('items count exact multiple of perPage', () => {
    var state = createPaginatorState({ items: items(10), perPage: 5 });
    expect(state.getPageCount()).toBe(2);
  });

  it('single item, single page', () => {
    var state = createPaginatorState({ items: ['only'], perPage: 1 });
    expect(state.getPageCount()).toBe(1);
    expect(state.isAtStart()).toBe(true);
    expect(state.isAtEnd()).toBe(true);
  });
});
