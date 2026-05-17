const NODE_POS = {
  B1: [170,  28], B2: [290,  88],
  A4: [170,  94], A3: [230, 124], A2: [290, 154], A1: [250, 174], A5: [110, 124],
  G1: [170, 160], G2: [230, 190], G3: [130, 240], G4: [130, 220],
  G5: [130, 180], G6: [170, 260], G7: [ 90, 200], G8: [290, 220], G9: [190, 270]
};

const LEVEL_COLOR = { ground: '#27AE60', first: '#F39C12', top: '#2980B9' };

export function renderApparatusSVG(graphData, activeRoute = []) {
  const activeNodes = new Set(activeRoute);
  const activeEdges = new Set();
  for (let i = 0; i < activeRoute.length - 1; i++) {
    activeEdges.add(`${activeRoute[i]}-${activeRoute[i + 1]}`);
    activeEdges.add(`${activeRoute[i + 1]}-${activeRoute[i]}`);
  }

  const struct = [
    `<polygon points="170,28 290,88 210,128 90,68" fill="#f0f0f0" stroke="#d0d0d0" stroke-width="1.5"/>`,
    `<polygon points="170,28 290,88 290,220 170,160" fill="#f8f8f8" stroke="#d8d8d8" stroke-width="1"/>`,
    `<line x1="290" y1="88"  x2="290" y2="220" stroke="#d0d0d0" stroke-width="1.5"/>`,
    `<line x1="90"  y1="68"  x2="90"  y2="200" stroke="#d0d0d0" stroke-width="1.5"/>`,
    `<line x1="210" y1="128" x2="210" y2="260" stroke="#d0d0d0" stroke-width="1.5"/>`,
    `<line x1="170" y1="160" x2="90"  y2="200" stroke="#e0e0e0" stroke-width="1"/>`,
    `<line x1="90"  y1="200" x2="210" y2="260" stroke="#e0e0e0" stroke-width="1"/>`,
    `<line x1="210" y1="260" x2="290" y2="220" stroke="#e0e0e0" stroke-width="1"/>`,
    `<line x1="170" y1="94"  x2="290" y2="154" stroke="#e0e0e0" stroke-width="1"/>`,
  ].join('');

  const edges = graphData.edges.map(({ from, to, bidirectional }) => {
    const p1 = NODE_POS[from], p2 = NODE_POS[to];
    if (!p1 || !p2) return '';
    const active = activeEdges.has(`${from}-${to}`);
    const stroke = active ? '#E74C3C' : '#bbb';
    const sw = active ? 3 : 1.5;
    let out = `<line id="edge-${from}-${to}" x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
    if (bidirectional === false && active) {
      const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
      const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / len * 6, ny = dy / len * 6;
      const px = -ny * 0.6, py = nx * 0.6;
      out += `<polygon points="${Math.round(mx+nx)},${Math.round(my+ny)} ${Math.round(mx-nx+px)},${Math.round(my-ny+py)} ${Math.round(mx-nx-px)},${Math.round(my-ny-py)}" fill="#E74C3C"/>`;
    }
    return out;
  }).join('');

  const nodes = graphData.nodes.map(({ id, level }) => {
    const pos = NODE_POS[id];
    if (!pos) return '';
    const [cx, cy] = pos;
    const col = LEVEL_COLOR[level] || LEVEL_COLOR.ground;
    const active = activeNodes.has(id);
    const r = active ? 10 : 7;
    const op = active ? 1 : 0.65;
    return `<circle id="node-${id}" cx="${cx}" cy="${cy}" r="${r}" fill="${col}" opacity="${op}" stroke="#fff" stroke-width="1.5"/>` +
      `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="7" fill="#fff" font-weight="bold" pointer-events="none">${id}</text>`;
  }).join('');

  const legend =
    `<circle cx="80" cy="276" r="5" fill="${LEVEL_COLOR.ground}" opacity="0.8"/>` +
    `<text x="88" y="280" font-size="8" fill="#666">Ground</text>` +
    `<circle cx="130" cy="276" r="5" fill="${LEVEL_COLOR.first}" opacity="0.8"/>` +
    `<text x="138" y="280" font-size="8" fill="#666">First</text>` +
    `<circle cx="172" cy="276" r="5" fill="${LEVEL_COLOR.top}" opacity="0.8"/>` +
    `<text x="180" y="280" font-size="8" fill="#666">Top</text>`;

  return `<svg viewBox="70 10 250 280" xmlns="http://www.w3.org/2000/svg" width="100%">` +
    `<g>${struct}</g>` +
    `<g>${edges}</g>` +
    `<g>${nodes}</g>` +
    `<g font-family="sans-serif">${legend}</g>` +
    `</svg>`;
}
