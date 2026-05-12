function init() {
  const container = document.getElementById('stations-container');
  if (!container) return;

  fetch('../../../content/logic-gates/sandbox.json')
    .then(function(r) { return r.json(); })
    .then(function(stations) {
      stations.forEach(function(config, idx) {
        if (idx > 0) {
          const hr = document.createElement('hr');
          hr.style.cssText = 'border:none;border-top:3px solid #ddd;margin:32px 0;';
          container.appendChild(hr);
        }

        const section = document.createElement('div');
        section.style.cssText = 'padding:0 16px;';

        const heading = document.createElement('h2');
        heading.textContent = config.label + ' gate';
        heading.style.cssText = `
          text-align:center;
          font-size:1.6em;
          font-weight:bold;
          color:${window.OutputUI.GATE_COLOURS[config.nodes[0].type] || '#555'};
          margin-bottom:16px;
          font-family:inherit;
        `;
        section.appendChild(heading);

        const svg = window.StationUI.buildStation(config, function(id) {
          svg._handleToggle(id);
        });
        section.appendChild(svg);
        container.appendChild(section);
      });
    });
}

window.addEventListener('load', init);
