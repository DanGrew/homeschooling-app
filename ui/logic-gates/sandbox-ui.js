function buildSection(config, container) {
  const section = document.createElement('div');
  section.style.cssText = 'padding:0 16px;';
  const heading = document.createElement('h2');
  heading.textContent = config.label + ' gate';
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
      function addSeparatorAndBuild(config) {
        addSeparator(container);
        buildSection(config, container);
      }
      stations.slice(0, 1).forEach(function(config) { buildSection(config, container); });
      stations.slice(1).forEach(addSeparatorAndBuild);
    })
    .catch(function(err) {
      container.textContent = 'Failed to load stations';
      console.error('sandbox load error:', err);
    });
}

window.addEventListener('load', init);
