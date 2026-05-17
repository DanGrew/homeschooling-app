// Isometric projection: sx=15, sy=8, sz=20, cx=90, cy=125
// Apparatus footprint: front-left G1(0,0) → front-right G3(8,0)
//                      back-left G5(0,4) → back-right G8(8,4)
// Level heights: ground z=0, first z=3, top z=6
const NODE_POS = {
  B1: [ 90,   5], B2: [210,  69],
  A4: [ 90,  65], A3: [135,  89], A1: [180, 145], A2: [150, 161], A5: [105, 121],
  G1: [ 90, 125], G2: [135, 149], G7: [180, 173], G3: [210, 189],
  G5: [ 30, 157], G6: [ 90, 189], G8: [150, 221], G9: [180, 205], G4: [120, 173]
};

const LEVEL_COLOR = { ground: '#27AE60', first: '#F39C12', top: '#2980B9' };

// Structural frame corners at top (z=6):
// front-left (0,0,6)=(90,5), front-right (8,0,6)=(210,69)
// back-left  (0,4,6)=(30,37), back-right (8,4,6)=(150,101)
const STRUCT =
  `<polygon points="90,5 210,69 150,101 30,37" fill="#f0f0f0" stroke="#d0d0d0" stroke-width="1.5"/>` +
  `<polygon points="90,5 210,69 210,189 90,125" fill="#f9f9f9" stroke="#e0e0e0" stroke-width="1"/>` +
  `<polygon points="90,5 30,37 30,157 90,125" fill="#f6f6f6" stroke="#e0e0e0" stroke-width="1"/>` +
  `<line x1="150" y1="101" x2="150" y2="221" stroke="#d8d8d8" stroke-width="1.5"/>` +
  `<line x1="30" y1="157" x2="150" y2="221" stroke="#e0e0e0" stroke-width="1"/>` +
  `<line x1="210" y1="189" x2="150" y2="221" stroke="#e0e0e0" stroke-width="1"/>`;

export function renderApparatusSVG(graphData, activeRoute = []) {
  const activeNodes = new Set(activeRoute);
  const activeEdges = new Set();
  for (let i = 0; i < activeRoute.length - 1; i++) {
    activeEdges.add(`${activeRoute[i]}-${activeRoute[i + 1]}`);
    activeEdges.add(`${activeRoute[i + 1]}-${activeRoute[i]}`);
  }

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
    `<circle cx="30" cy="236" r="5" fill="${LEVEL_COLOR.ground}" opacity="0.8"/>` +
    `<text x="38" y="240" font-size="8" fill="#666">Ground</text>` +
    `<circle cx="84" cy="236" r="5" fill="${LEVEL_COLOR.first}" opacity="0.8"/>` +
    `<text x="92" y="240" font-size="8" fill="#666">First</text>` +
    `<circle cx="128" cy="236" r="5" fill="${LEVEL_COLOR.top}" opacity="0.8"/>` +
    `<text x="136" y="240" font-size="8" fill="#666">Top</text>`;

  return `<svg viewBox="10 -5 230 250" xmlns="http://www.w3.org/2000/svg" width="100%">` +
    `<g>${STRUCT}</g>` +
    `<g>${edges}</g>` +
    `<g>${nodes}</g>` +
    `<g font-family="sans-serif">${legend}</g>` +
    `</svg>`;
}
