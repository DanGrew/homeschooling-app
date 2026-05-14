// Generates all 16 ordered gate-pair linear puzzles.
// Run: node core/logic-gates/generate-linear-puzzles.js
// Output: content/logic-gates/puzzles-linear.json

const fs   = require('fs');
const path = require('path');
const { evalGate } = require('./logic-engine.js');

const GATES        = ['AND', 'OR', 'XOR', 'NOT'];
const OUTPUT_TYPES = ['lamp', 'fan'];

function isBinary(gate) { return gate !== 'NOT'; }

function evalCircuit(config) {
  const vals = {};
  config.inputs.forEach(s => { vals[s.id] = s.state; });
  config.nodes.forEach(n => {
    vals[n.id] = evalGate(n.type, n.inputs.map(id => !!vals[id]));
  });
  return !!vals[config.outputs[0].source];
}

// Seeded LCG for reproducible output-type assignment
let seed = 0xdeadbeef;
function rng() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}

function buildPuzzle(gate1, gate2) {
  const g1Bin = isBinary(gate1);
  const g2Bin = isBinary(gate2);

  const g1SwCount    = g1Bin ? 2 : 1;
  const g2ExtraCount = g2Bin ? 1 : 0;

  // ID: <switches-to-gate1>-<gate1>-<extra-switches-to-gate2>-<gate2>
  const id = `${g1SwCount}-${gate1}-${g2ExtraCount}-${gate2}`;

  // Build switches — all off
  const labels = 'ABCDEFGH';
  const totalSw = g1SwCount + g2ExtraCount;
  const switches = Array.from({ length: totalSw }, (_, i) => ({
    id: `S${i}`, state: false, label: labels[i],
  }));

  // Cell layout — main flow along row 1, binary inputs at rows 0+2
  // binary→binary : S0[0,0] S1[0,2] G1[1,1] S2[2,0] G2[3,1] O1[4,1]  5×3
  // binary→NOT    : S0[0,0] S1[0,2] G1[1,1]          G2[2,1] O1[3,1]  4×3
  // NOT→binary    : S0[0,1]         G1[1,1] S1[2,0]  G2[3,1] O1[4,1]  5×3
  // NOT→NOT       : S0[0,1]         G1[1,1]           G2[2,1] O1[3,1]  4×3

  let inputCells, g1Cell, g2Cell, outCell, gridCols;

  if (g1Bin && g2Bin) {
    inputCells = [[0,0],[0,2],[2,0]];
    g1Cell = [1,1]; g2Cell = [3,1]; outCell = [4,1]; gridCols = 5;
  } else if (g1Bin && !g2Bin) {
    inputCells = [[0,0],[0,2]];
    g1Cell = [1,1]; g2Cell = [2,1]; outCell = [3,1]; gridCols = 4;
  } else if (!g1Bin && g2Bin) {
    inputCells = [[0,1],[2,0]];
    g1Cell = [1,1]; g2Cell = [3,1]; outCell = [4,1]; gridCols = 5;
  } else {
    inputCells = [[0,1]];
    g1Cell = [1,1]; g2Cell = [2,1]; outCell = [3,1]; gridCols = 4;
  }

  const inputs = switches.map((s, i) => ({ ...s, cell: inputCells[i] }));
  const g1Inputs = switches.slice(0, g1SwCount).map(s => s.id);
  const g2Inputs = ['G1', ...switches.slice(g1SwCount).map(s => s.id)];

  const outType = OUTPUT_TYPES[Math.floor(rng() * OUTPUT_TYPES.length)];

  const config = {
    id,
    category: 'linear',
    grid: { cols: gridCols, rows: 3 },
    inputs,
    nodes: [
      { id: 'G1', type: gate1, inputs: g1Inputs, cell: g1Cell },
      { id: 'G2', type: gate2, inputs: g2Inputs, cell: g2Cell },
    ],
    outputs: [{ id: 'O1', type: outType, source: 'G2', cell: outCell }],
  };

  const currentOut = evalCircuit(config);
  config.goal = [{ id: 'O1', value: !currentOut }];

  return config;
}

const puzzles = [];
for (const gate1 of GATES) {
  for (const gate2 of GATES) {
    puzzles.push(buildPuzzle(gate1, gate2));
  }
}

const outPath = path.resolve(__dirname, '../../content/logic-gates/puzzles-linear.json');
fs.writeFileSync(outPath, JSON.stringify(puzzles, null, 2));
console.log(`Generated ${puzzles.length} puzzles → ${outPath}`);
