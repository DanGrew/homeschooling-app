export function createPaginatorState({ items = [], perPage = 1, wrap = false } = {}) {
  var _items = items;
  var _current = 0;

  function pageCount() {
    return Math.max(1, Math.ceil(_items.length / perPage));
  }

  function next() {
    var pc = pageCount();
    _current = wrap ? (_current + 1) % pc : Math.min(pc - 1, _current + 1);
  }

  function prev() {
    var pc = pageCount();
    _current = wrap ? (_current + pc - 1) % pc : Math.max(0, _current - 1);
  }

  function reset(newItems) {
    _items = newItems || [];
    _current = 0;
  }

  function getPage() { return _current; }

  function getPageCount() { return pageCount(); }

  function getSlice() {
    if (perPage === 1) return _items[_current];
    return _items.slice(_current * perPage, (_current + 1) * perPage);
  }

  function isAtStart() { return _current === 0; }

  function isAtEnd() { return _current >= pageCount() - 1; }

  return { next, prev, reset, getPage, getPageCount, getSlice, isAtStart, isAtEnd };
}
