#!/usr/bin/env node
// Audits colouring.json files for similar colours and optionally applies merges.
// Usage:
//   node scripts/audit-colouring-colours.js [--threshold 50]          # report only
//   node scripts/audit-colouring-colours.js [--threshold 50] --apply  # apply merges

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let threshold = 50;
let apply = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--threshold' && args[i + 1]) threshold = parseFloat(args[++i]);
  if (args[i] === '--apply') apply = true;
}

const entriesDir = path.join(__dirname, '..', 'app', 'dictionary', 'entries');

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function dist(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

function cluster(colourCounts, thresh) {
  const clusters = [];
  for (const [hex, count] of colourCounts.entries()) {
    const rgb = hexToRgb(hex);
    const match = clusters.find(c => dist(c.rgb, rgb) < thresh);
    if (match) {
      match.members.push({ hex, count });
    } else {
      clusters.push({ rgb, members: [{ hex, count }] });
    }
  }
  return clusters.filter(c => c.members.length > 1);
}

const concepts = fs.readdirSync(entriesDir).filter(d =>
  fs.existsSync(path.join(entriesDir, d, 'colouring.json'))
);

let totalMerges = 0;
let totalApplied = 0;

concepts.forEach(concept => {
  const jsonPath = path.join(entriesDir, concept, 'colouring.json');
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const colourCounts = new Map();
  (json.shapes || []).forEach(s => {
    if (s.colour && !s.fixed) colourCounts.set(s.colour, (colourCounts.get(s.colour) || 0) + 1);
  });

  if (colourCounts.size < 2) return;

  const groups = cluster(colourCounts, threshold);
  if (!groups.length) return;

  // build replacement map: old hex → rep hex
  const replaceMap = new Map();
  groups.forEach(g => {
    g.members.sort((a, b) => b.count - a.count);
    const rep = g.members[0];
    g.members.slice(1).forEach(m => replaceMap.set(m.hex, rep.hex));
  });

  console.log(`\n${concept.toUpperCase()}`);
  groups.forEach(g => {
    const rep = g.members[0];
    const others = g.members.slice(1);
    const distStr = others.map(m =>
      `${m.hex}×${m.count} (dist ${dist(hexToRgb(rep.hex), hexToRgb(m.hex)).toFixed(0)})`
    ).join(', ');
    console.log(`  keep ${rep.hex}×${rep.count}  →  merge: ${distStr}`);
    totalMerges += others.length;
  });

  if (apply) {
    json.shapes = json.shapes.map(s => {
      if (s.colour && replaceMap.has(s.colour)) {
        return Object.assign({}, s, { colour: replaceMap.get(s.colour) });
      }
      return s;
    });
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n');
    console.log(`  applied ${replaceMap.size} replacement(s)`);
    totalApplied += replaceMap.size;
  }
});

console.log(`\n─────────────────────────────────`);
console.log(`threshold: ${threshold}  |  merges proposed: ${totalMerges}`);
if (apply) console.log(`applied: ${totalApplied} colour replacement(s) across ${concepts.length} entries`);
else console.log(`\nRerun with --apply to write changes.`);
