var DISPLAY = ['none', 'block'];

export function render(sky) {
  document.getElementById('sky-bg').style.background =
    'linear-gradient(to bottom, ' + sky.topColor + ', ' + sky.bottomColor + ')';
  var sun  = document.getElementById('sky-sun');
  var moon = document.getElementById('sky-moon');
  sun.style.display  = DISPLAY[+sky.sun];
  sun.style.left     = sky.celestialX + '%';
  sun.style.top      = sky.celestialY + '%';
  moon.style.display = DISPLAY[+sky.moon];
  moon.style.left    = sky.celestialX + '%';
  moon.style.top     = sky.celestialY + '%';
}
