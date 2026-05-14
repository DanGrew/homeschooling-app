// Generates all 30 converging puzzles: 10 unordered gate pairs × 3 binary GateC.
// Topology: GateA + GateB (independent branches) → GateC → output
// Run: node core/logic-gates/generate-converging-puzzles.js

const fs   = require('fs');
const path = require('path');
const { evalGate } = require('./logic-engine.js');

const GATES        = ['AND', 'OR', 'XOR', 'NOT'];
const BINARY_GATES = ['AND', 'OR', 'XOR'];
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

let seed = 0xc0ffee;
function rng() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
}

function buildPuzzle(gateA, gateB, gateC) {
  const aBin = isBinary(gateA);
  const bBin = isBinary(gateB);

  const aSwCount = aBin ? 2 : 1;
  const bSwCount = bBin ? 2 : 1;

  // ID: <sw>-<gateA>_<sw>-<gateB>-<gateC>
  const id = `${aSwCount}-${gateA}_${bSwCount}-${gateB}-${gateC}`;

  const labels = 'ABCDEFGH';
  const switches = Array.from({ length: aSwCount + bSwCount }, (_, i) => ({
    id: `S${i}`, state: false, label: labels[i],
  }));

  // Layout — main converging flow, top branch row 0, bottom branch row 3/4
  //
  // NOT|NOT        grid 4×4: G1[1,0] G2[1,3]          G3[2,1] O1[3,1]
  // binary|NOT     grid 4×4: G1[1,0] G2[1,3]          G3[2,1] O1[3,1]
  // binary|binary  grid 4×5: G1[1,0] G2[1,4]          G3[2,2] O1[3,2]

  let aCells, bCells, g1Cell, g2Cell, g3Cell, outCell, gridRows;

  if (aBin && bBin) {
    aCells   = [[0,0],[0,1]];
    bCells   = [[0,3],[0,4]];
    g1Cell   = [1,0]; g2Cell = [1,4];
    g3Cell   = [2,2]; outCell = [3,2];
    gridRows = 5;
  } else if (aBin && !bBin) {
    // gateA binary (top), gateB NOT (bottom)
    aCells   = [[0,0],[0,1]];
    bCells   = [[0,3]];
    g1Cell   = [1,0]; g2Cell = [1,3];
    g3Cell   = [2,1]; outCell = [3,1];
    gridRows = 4;
  } else {
    // NOT|NOT (loop order guarantees !aBin && bBin never occurs)
    aCells   = [[0,0]];
    bCells   = [[0,3]];
    g1Cell   = [1,0]; g2Cell = [1,3];
    g3Cell   = [2,1]; outCell = [3,1];
    gridRows = 4;
  }

  const aSwitches = switches.slice(0, aSwCount);
  const bSwitches = switches.slice(aSwCount);

  const inputs = [
    ...aSwitches.map((s, i) => ({ ...s, cell: aCells[i] })),
    ...bSwitches.map((s, i) => ({ ...s, cell: bCells[i] })),
  ];

  const outType = OUTPUT_TYPES[Math.floor(rng() * OUTPUT_TYPES.length)];

  const config = {
    id,
    category: 'converging',
    grid: { cols: 4, rows: gridRows },
    inputs,
    nodes: [
      { id: 'G1', type: gateA, inputs: aSwitches.map(s => s.id), cell: g1Cell },
      { id: 'G2', type: gateB, inputs: bSwitches.map(s => s.id), cell: g2Cell },
      { id: 'G3', type: gateC, inputs: ['G1', 'G2'],              cell: g3Cell },
    ],
    outputs: [{ id: 'O1', type: outType, source: 'G3', cell: outCell }],
  };

  const currentOut = evalCircuit(config);
  config.goal = [{ id: 'O1', value: !currentOut }];

  return config;
}

const puzzles = [];

// Unordered pairs: i <= j in GATES order
for (let i = 0; i < GATES.length; i++) {
  for (let j = i; j < GATES.length; j++) {
    for (const gateC of BINARY_GATES) {
      puzzles.push(buildPuzzle(GATES[i], GATES[j], gateC));
    }
  }
}

const outPath = path.resolve(__dirname, '../../content/logic-gates/puzzles-converging.json');
fs.writeFileSync(outPath, JSON.stringify(puzzles, null, 2));
console.log(`Generated ${puzzles.length} puzzles → ${outPath}`);
