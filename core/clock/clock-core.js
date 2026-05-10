function hourColors(hour) {
  if (hour < 6)  return ['#0D1458', '#1A237E'];
  if (hour < 9)  return ['#FF7043', '#FFB74D'];
  if (hour < 11) return ['#81D4FA', '#E1F5FE'];
  if (hour < 17) return ['#039BE5', '#B3E5FC'];
  if (hour < 19) return ['#EF6C00', '#FFA726'];
  if (hour < 20) return ['#4527A0', '#7E57C2'];
  return               ['#1A237E', '#3949AB'];
}

export function hourToAngles(hour) {
  return { hourDeg: (hour % 12) / 12 * 360, minuteDeg: 0 };
}

export function hourToSky(hour) {
  var isSun = hour >= 6 && hour < 20;
  var a = isSun
    ? (hour - 6) / 14 * Math.PI
    : (hour >= 20 ? hour - 20 : hour + 4) / 12 * Math.PI;
  var cx = (1 - Math.cos(a)) / 2 * 86 + 7;
  var cy = (1 - Math.sin(a)) * 32 + 4;
  var colors = hourColors(hour);
  return {
    topColor: colors[0], bottomColor: colors[1],
    sun: isSun, moon: !isSun,
    celestialX: cx, celestialY: cy
  };
}

export function nextDegrees(fromHour, toHour) {
  var from = (fromHour % 12) / 12 * 360;
  var to   = (toHour   % 12) / 12 * 360;
  var delta = to - from;
  return delta <= 0 ? delta + 360 : delta;
}

export function generateChoices(presets, correctIdx, n) {
  var indices = [correctIdx];
  var pool = presets.map(function(_, i) { return i; }).filter(function(i) { return i !== correctIdx; });
  while (indices.length < n && pool.length > 0) {
    var r = Math.floor(Math.random() * pool.length);
    indices.push(pool.splice(r, 1)[0]);
  }
  for (var i = indices.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
  }
  return indices;
}
