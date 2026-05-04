export function activeIndex(t, words) {
  var idx = -1;
  for (var i = 0; i < words.length; i++) {
    if (words[i].t <= t) idx = i;
    else break;
  }
  return idx;
}
