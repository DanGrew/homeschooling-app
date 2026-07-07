export function notNull(value) {
  return value !== null;
}

export function firstIndexAfter(values, target) {
  return values.findIndex(function(v) { return v > target; });
}

export function sortByName(items) {
  items.sort(function(a, b) { return a.name.localeCompare(b.name); });
  return items;
}
