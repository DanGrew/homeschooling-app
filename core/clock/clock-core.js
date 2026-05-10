export function hourToAngles(hour) {
  return { hourDeg: (hour % 12) / 12 * 360, minuteDeg: 0 };
}

export function hourToSky(hour) {
  if (hour < 9)  return { topColor: '#FF7043', bottomColor: '#FFB74D', sun: true,  moon: false, celestialX: 14, celestialY: 30 };
  if (hour < 14) return { topColor: '#039BE5', bottomColor: '#B3E5FC', sun: true,  moon: false, celestialX: 50, celestialY: 5  };
  if (hour < 17) return { topColor: '#1565C0', bottomColor: '#90CAF9', sun: true,  moon: false, celestialX: 74, celestialY: 14 };
  if (hour < 20) return { topColor: '#BF360C', bottomColor: '#FF8F00', sun: true,  moon: false, celestialX: 84, celestialY: 32 };
  if (hour < 22) return { topColor: '#1A237E', bottomColor: '#3949AB', sun: false, moon: true,  celestialX: 35, celestialY: 18 };
  return           { topColor: '#0D1458', bottomColor: '#1A237E', sun: false, moon: true,  celestialX: 56, celestialY: 8  };
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
