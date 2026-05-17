var DO_SPEAK = {'true':function(el,t){window.__makeSpeakable(el,t);},'false':function(){}};
var MAYBE_SEP = {'true':addSeparator,'false':function(){}};

function buildSection(config, container, idx) {
  const section = document.createElement('div');
  section.id = 'sandbox-station-' + idx;
  section.style.cssText = 'padding:0 16px;';
  const heading = document.createElement('h2');
  heading.textContent = config.label + ' gate';
  DO_SPEAK[String(typeof window.__makeSpeakable==='function')](heading, config.label + ' gate');
  heading.style.cssText = `
    text-align:center;
    font-size:1.6em;
    font-weight:bold;
    color:${window.OutputUI.GATE_COLOURS[config.nodes[0].type]};
    margin-bottom:16px;
    font-family:inherit;
  `;
  section.appendChild(heading);
  const svg = window.StationUI.buildStation(config, function(id) {
    svg._handleToggle(id);
  });
  section.appendChild(svg);
  container.appendChild(section);
}

function addSeparator(container) {
  const hr = document.createElement('hr');
  hr.style.cssText = 'border:none;border-top:3px solid #ddd;margin:32px 0;';
  container.appendChild(hr);
}

function init() {
  const container = document.getElementById('stations-container');
  fetch('../../../content/logic-gates/sandbox.json?v=2')
    .then(function(r) { return r.json(); })
    .then(function(stations) {
      stations.forEach(function(config, i) {
        MAYBE_SEP[String(i > 0)](container);
        buildSection(config, container, i);
      });
    })
    .catch(function(err) {
      container.textContent = 'Failed to load stations';
      console.error('sandbox load error:', err);
    });
}

window.addEventListener('load', init);
