#!/usr/bin/env node
// Audits colouring.json files for colour overload and optionally applies merges.
//
// Modes:
//   (default)     Cluster by RGB distance, flag near-identical shades
//   --by-family   Group by hue family, enforce max 2 shades per family
//                 True blacks (L<12%) and whites (L>88%) are always exempt.
//
// Flags:
//   --threshold N   RGB distance threshold for default mode (default: 50)
//   --apply         Write changes to disk
//
// Examples:
//   node scripts/audit-colouring-colours.js
//   node scripts/audit-colouring-colours.js --by-family
//   node scripts/audit-colouring-colours.js --by-family --apply

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let threshold = 50;
let apply = false;
let byFamily = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--threshold' && args[i + 1]) threshold = parseFloat(args[++i]);
  if (args[i] === '--apply') apply = true;
  if (args[i] === '--by-family') byFamily = true;
}

const entriesDir = path.join(__dirname, '..', 'app', 'dictionary', 'entries');

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b), l = (max+min)/2;
  if (max === min) return [0, 0, l];
  const d = max-min, s = l > 0.5 ? d/(2-max-min) : d/(max+min);
  let h;
  if (max===r) h = ((g-b)/d+(g<b?6:0))/6;
  else if (max===g) h = ((b-r)/d+2)/6;
  else h = ((r-g)/d+4)/6;
  return [h*360, s, l];
}

function hueFamily(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (l < 0.12) return null;  // true black — exempt
  if (l > 0.88) return null;  // true white — exempt
  if (s < 0.12) return 'grey';
  if (h < 20 || h >= 340) return 'red';
  if (h < 45) return 'orange/brown';
  if (h < 70) return 'yellow';
  if (h < 160) return 'green';
  if (h < 200) return 'teal';
  if (h < 260) return 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}

function dist(a, b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

function nearestOf(hex, candidates) {
  const rgb = hexToRgb(hex);
  return candidates.reduce((best, c) => dist(hexToRgb(c), rgb) < dist(hexToRgb(best), rgb) ? c : best);
}

function clusterByDistance(colourCounts, thresh) {
  const clusters = [];
  for (const [hex, count] of colourCounts.entries()) {
    const rgb = hexToRgb(hex);
    const match = clusters.find(c => dist(c.rgb, rgb) < thresh);
    if (match) match.members.push({ hex, count });
    else clusters.push({ rgb, members: [{ hex, count }] });
  }
  return clusters.filter(c => c.members.length > 1);
}

function clusterByFamily(colourCounts) {
  const families = {};
  for (const [hex, count] of colourCounts.entries()) {
    const fam = hueFamily(hex);
    if (!fam) continue;
    if (!families[fam]) families[fam] = [];
    families[fam].push({ hex, count });
  }
  // return only families with >2 distinct colours
  return Object.entries(families)
    .filter(([, members]) => members.length > 2)
    .map(([family, members]) => ({ family, members: members.sort((a, b) => b.count - a.count) }));
}

const concepts = fs.readdirSync(entriesDir).filter(d =>
  fs.existsSync(path.join(entriesDir, d, 'colouring.json'))
);

let totalDropped = 0;
let totalApplied = 0;

concepts.forEach(concept => {
  const jsonPath = path.join(entriesDir, concept, 'colouring.json');
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const colourCounts = new Map();
  (json.shapes || []).forEach(s => {
    if (s.colour && !s.fixed) colourCounts.set(s.colour, (colourCounts.get(s.colour) || 0) + 1);
  });

  if (colourCounts.size < 2) return;

  const replaceMap = new Map();

  if (byFamily) {
    const groups = clusterByFamily(colourCounts);
    if (!groups.length) return;

    console.log(`\n${concept.toUpperCase()}`);
    groups.forEach(({ family, members }) => {
      const keep = members.slice(0, 2).map(m => m.hex);
      const drop = members.slice(2);
      drop.forEach(m => {
        const target = nearestOf(m.hex, keep);
        replaceMap.set(m.hex, target);
        console.log(`  [${family}] drop ${m.hex}×${m.count} → ${target}`);
      });
      totalDropped += drop.length;
    });

  } else {
    const groups = clusterByDistance(colourCounts, threshold);
    if (!groups.length) return;

    console.log(`\n${concept.toUpperCase()}`);
    groups.forEach(g => {
      g.members.sort((a, b) => b.count - a.count);
      const rep = g.members[0];
      g.members.slice(1).forEach(m => {
        replaceMap.set(m.hex, rep.hex);
        console.log(`  keep ${rep.hex}×${rep.count}  →  merge ${m.hex}×${m.count} (dist ${dist(hexToRgb(rep.hex), hexToRgb(m.hex)).toFixed(0)})`);
        totalDropped++;
      });
    });
  }

  if (apply && replaceMap.size) {
    json.shapes = json.shapes.map(s => {
      if (s.colour && replaceMap.has(s.colour)) return Object.assign({}, s, { colour: replaceMap.get(s.colour) });
      return s;
    });
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n');
    console.log(`  ✓ applied ${replaceMap.size} replacement(s)`);
    totalApplied += replaceMap.size;
  }
});

const mode = byFamily ? `by-family (max 2 per hue, black/white exempt)` : `distance threshold: ${threshold}`;
console.log(`\n─────────────────────────────────`);
console.log(`mode: ${mode}  |  colours to drop: ${totalDropped}`);
if (apply) console.log(`applied: ${totalApplied} replacement(s)`);
else console.log(`Rerun with --apply to write changes.`);
