const OUTPUT_LABELS = { lamp: 'light', fan: 'fan', fountain: 'fountain' };
const GOAL_SUFFIX = ['OFF', 'ON'];

function goalText(goal, outputs) {
  const out = outputs.find(o => o.id === goal[0].id);
  return 'Turn the ' + OUTPUT_LABELS[out.type] + ' ' + GOAL_SUFFIX[+goal[0].value];
}

function cellCenter(cell, cellW, cellH) {
  return { x: cell[0] * cellW + cellW / 2, y: cell[1] * cellH + cellH / 2 };
}

if (typeof module !== 'undefined') module.exports = { goalText, cellCenter };
