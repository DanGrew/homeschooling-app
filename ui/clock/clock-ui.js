var NUMS = [
  [140,32,'12'],[194,47,'1'],[234,86,'2'],[248,140,'3'],
  [234,194,'4'],[194,234,'5'],[140,248,'6'],[86,234,'7'],
  [46,194,'8'],[32,140,'9'],[46,86,'10'],[86,47,'11']
];

var FACE = [
  '<svg viewBox="0 0 280 280" style="width:min(260px,58vw);height:min(260px,58vw)">',
  '<circle cx="140" cy="140" r="135" fill="#FFFDE7" stroke="#795548" stroke-width="4"/>',
  '<circle cx="140" cy="140" r="2" fill="none" stroke="#D7CCC8" stroke-width="1"/>'
].concat(
  NUMS.map(function(n) {
    return '<g data-num="' + n[2] + '" style="cursor:pointer">' +
           '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="18" fill="transparent"/>' +
           '<text x="' + n[0] + '" y="' + n[1] + '" text-anchor="middle" dominant-baseline="central" font-size="22" font-weight="bold" fill="#4E342E" font-family="sans-serif" style="pointer-events:none">' + n[2] + '</text>' +
           '</g>';
  })
).concat([
  '<g id="clock-minute-hand" style="transform-origin:140px 140px;transition:transform 0.8s ease-in-out">',
  '<rect x="137.5" y="28" width="5" height="112" rx="2.5" fill="#546E7A"/>',
  '<rect x="129" y="28" width="22" height="112" rx="11" fill="transparent" data-hand="minute" style="cursor:pointer"/>',
  '</g>',
  '<g id="clock-hour-hand" style="transform-origin:140px 140px;transition:transform 0.8s ease-in-out">',
  '<rect x="136" y="60" width="8" height="80" rx="4" fill="#2E7D32"/>',
  '<rect x="128" y="60" width="24" height="80" rx="12" fill="transparent" data-hand="hour" style="cursor:pointer"/>',
  '</g>',
  '<circle cx="140" cy="140" r="9" fill="#4E342E"/>',
  '</svg>'
]);

var SVG = FACE.join('');

export function init(container) {
  container.innerHTML = SVG;
}

export function setHandDeg(hourDeg, minuteDeg) {
  document.getElementById('clock-hour-hand').style.transform   = 'rotate(' + hourDeg   + 'deg)';
  document.getElementById('clock-minute-hand').style.transform = 'rotate(' + minuteDeg + 'deg)';
}
