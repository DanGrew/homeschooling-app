#!/usr/bin/env node
// Detects and fixes suspicious z-order in colouring.json files.
//
// ## The problem
// The colouring renderer appends shapes in array order via svg.appendChild —
// SVG painter algorithm means later shapes render ON TOP of earlier ones.
// If a large background shape appears after a small detail shape, it covers it.
//
// ## Detection heuristics
// Two flags are raised for each overlapping pair (shape[i] below, shape[j] on top):
//
//   large-on-small       shape[j] area is >2x shape[i] AND overlap >30%
//                        → a big shape covering a small detail is suspicious
//
//   colourable-over-fixed  shape[i] is noColour/fixed, shape[j] is colourable,
//                          shape[j] is ≥70% the area of shape[i], overlap >20%
//                          → a colouring region covering a fixed decoration
//                          (small colourable details on top of fixed bases are OK)
//
// ## Fix (--apply)
// Sorts each flagged file's shapes by bounding box area descending:
//   - Large shapes first → render as background
//   - Small shapes last  → render as foreground details
// Secondary: colourable before noColour of equal area (fixed decorations sit on
// top of the coloured region they decorate, e.g. beak markings over belly).
// Only flagged files are written. Ordering within equal-area ties is preserved.
//
// ## Bbox approximation
// Ellipse/circle/rect: exact. Path: endpoint traversal (bezier control points
// excluded). This gives a good-enough approximation for area comparison; it does
// not need to be pixel-perfect because the heuristics use large thresholds.
//
// ## Usage
//   node scripts/check-colouring-zorder.js
//   node scripts/check-colouring-zorder.js --concept bird
//   node scripts/check-colouring-zorder.js --area-ratio 3.0
//   node scripts/check-colouring-zorder.js --apply
//   node scripts/check-colouring-zorder.js --apply --concept kiwi
//   node scripts/check-colouring-zorder.js --exit-code    (non-zero exit if suspects found)
//
//   npm run audit:zorder
//   npm run audit:zorder -- --apply

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let filterConcept = null;
let areaRatioThreshold = 2.0;
let apply = false;
let exitCode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--concept' && args[i + 1]) filterConcept = args[++i];
  if (args[i] === '--area-ratio' && args[i + 1]) areaRatioThreshold = parseFloat(args[++i]);
  if (args[i] === '--apply') apply = true;
  if (args[i] === '--exit-code') exitCode = true;
}

const entriesDir = path.join(__dirname, '..', 'content', 'dictionary', 'entries');

// Parse SVG path d attribute into absolute coordinate endpoints.
// Handles M/L/H/V/C/Q/S/T/A/Z (upper=absolute, lower=relative).
// Control points for bezier curves are skipped — only endpoints tracked.
function pathPoints(d) {
  const points = [];
  let cx = 0, cy = 0, sx = 0, sy = 0;
  const tokens = d.match(/[MLHVCSQTAZmlhvcsqtaz]|[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g) || [];
  let i = 0;
  let cmd = 'M';

  function num() { return parseFloat(tokens[i++]); }

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[MLHVCSQTAZmlhvcsqtaz]/.test(t)) { cmd = t; i++; continue; }

    switch (cmd) {
      case 'M': cx = num(); cy = num(); sx = cx; sy = cy; points.push({x:cx,y:cy}); cmd = 'L'; break;
      case 'm': cx += num(); cy += num(); sx = cx; sy = cy; points.push({x:cx,y:cy}); cmd = 'l'; break;
      case 'L': cx = num(); cy = num(); points.push({x:cx,y:cy}); break;
      case 'l': cx += num(); cy += num(); points.push({x:cx,y:cy}); break;
      case 'H': cx = num(); points.push({x:cx,y:cy}); break;
      case 'h': cx += num(); points.push({x:cx,y:cy}); break;
      case 'V': cy = num(); points.push({x:cx,y:cy}); break;
      case 'v': cy += num(); points.push({x:cx,y:cy}); break;
      case 'C': num();num(); num();num(); cx=num(); cy=num(); points.push({x:cx,y:cy}); break;
      case 'c': num();num(); num();num(); cx+=num(); cy+=num(); points.push({x:cx,y:cy}); break;
      case 'S': num();num(); cx=num(); cy=num(); points.push({x:cx,y:cy}); break;
      case 's': num();num(); cx+=num(); cy+=num(); points.push({x:cx,y:cy}); break;
      case 'Q': num();num(); cx=num(); cy=num(); points.push({x:cx,y:cy}); break;
      case 'q': num();num(); cx+=num(); cy+=num(); points.push({x:cx,y:cy}); break;
      case 'T': cx=num(); cy=num(); points.push({x:cx,y:cy}); break;
      case 't': cx+=num(); cy+=num(); points.push({x:cx,y:cy}); break;
      case 'A': num();num();num();num();num(); cx=num(); cy=num(); points.push({x:cx,y:cy}); break;
      case 'a': num();num();num();num();num(); cx+=num(); cy+=num(); points.push({x:cx,y:cy}); break;
      case 'Z': case 'z': cx=sx; cy=sy; break;
      default: i++; break;
    }
  }
  return points;
}

function shapeBbox(shape) {
  const { tag, attrs } = shape;

  if (tag === 'ellipse') {
    const cx = parseFloat(attrs.cx || 0);
    const cy = parseFloat(attrs.cy || 0);
    const rx = parseFloat(attrs.rx || 0);
    const ry = parseFloat(attrs.ry || 0);
    return { x: cx - rx, y: cy - ry, w: 2 * rx, h: 2 * ry };
  }

  if (tag === 'circle') {
    const cx = parseFloat(attrs.cx || 0);
    const cy = parseFloat(attrs.cy || 0);
    const r = parseFloat(attrs.r || 0);
    return { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r };
  }

  if (tag === 'rect') {
    return {
      x: parseFloat(attrs.x || 0),
      y: parseFloat(attrs.y || 0),
      w: parseFloat(attrs.width || 0),
      h: parseFloat(attrs.height || 0),
    };
  }

  if (tag === 'path' && attrs.d) {
    const pts = pathPoints(attrs.d);
    if (!pts.length) return null;
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    const x2 = Math.max(...xs), y2 = Math.max(...ys);
    return { x, y, w: x2 - x, h: y2 - y };
  }

  return null;
}

function area(bbox) { return bbox.w * bbox.h; }

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function overlapArea(a, b) {
  const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return ix > 0 && iy > 0 ? ix * iy : 0;
}

// Sort shapes so large (background) shapes render first, small (detail) shapes last.
// Colourable shapes sort before noColour shapes of equal area so fixed decorations
// sit on top of the coloured region they belong to.
function sortedByArea(shapes, bboxes) {
  return shapes
    .map((s, i) => ({ s, a: bboxes[i] ? area(bboxes[i]) : 0, i }))
    .sort((x, y) => {
      const areaDiff = y.a - x.a;
      if (Math.abs(areaDiff) > 10) return areaDiff; // larger area first
      const fx = x.s.noColour ? 1 : 0;
      const fy = y.s.noColour ? 1 : 0;
      if (fx !== fy) return fx - fy; // colourable before noColour for same area
      return x.i - y.i; // stable: preserve original relative order
    })
    .map(x => x.s);
}

function detectFlags(shapes, bboxes) {
  const flags = [];
  for (let i = 0; i < shapes.length; i++) {
    const bboxI = bboxes[i];
    if (!bboxI) continue;
    const areaI = area(bboxI);
    const si = shapes[i];

    for (let j = i + 1; j < shapes.length; j++) {
      const bboxJ = bboxes[j];
      if (!bboxJ) continue;
      const areaJ = area(bboxJ);
      const sj = shapes[j];

      if (!overlaps(bboxI, bboxJ)) continue;

      const ov = overlapArea(bboxI, bboxJ);
      const ovRatio = ov / Math.min(areaI, areaJ);

      if (areaI > 0 && areaJ / areaI > areaRatioThreshold && ovRatio > 0.3) {
        flags.push({
          type: 'large-on-small',
          below: si.id, above: sj.id,
          ratio: (areaJ / areaI).toFixed(1),
          overlap: (ovRatio * 100).toFixed(0) + '%',
        });
      }

      // Only flag when colourable is ≥70% size of fixed shape — a smaller colourable
      // detail on top of a fixed base is intentional (e.g. inner pupil on eye ring).
      if (si.noColour && !sj.noColour && ovRatio > 0.2 && areaJ >= areaI * 0.7) {
        flags.push({
          type: 'colourable-over-fixed',
          below: si.id + ' (fixed)', above: sj.id,
          overlap: (ovRatio * 100).toFixed(0) + '%',
        });
      }
    }
  }
  return flags;
}

const concepts = fs.readdirSync(entriesDir)
  .filter(d => fs.existsSync(path.join(entriesDir, d, 'colouring.json')))
  .filter(d => !filterConcept || d === filterConcept);

let totalFlags = 0;
let totalFixed = 0;

concepts.forEach(concept => {
  const jsonPath = path.join(entriesDir, concept, 'colouring.json');
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const shapes = json.shapes || [];
  const bboxes = shapes.map(s => shapeBbox(s));
  const flags = detectFlags(shapes, bboxes);

  if (!flags.length) return;

  totalFlags += flags.length;
  console.log(`\n${concept.toUpperCase()} — ${flags.length} suspect(s)`);
  flags.forEach(f => {
    if (f.type === 'large-on-small') {
      console.log(`  [large-on-small]        ${f.below} below, ${f.above} on top  (${f.ratio}x area, ${f.overlap} overlap)`);
    } else {
      console.log(`  [colourable-over-fixed] ${f.below} below, ${f.above} on top  (${f.overlap} overlap)`);
    }
  });

  if (apply) {
    const sorted = sortedByArea(shapes, bboxes);
    const changed = sorted.some((s, i) => s.id !== shapes[i].id);
    if (changed) {
      json.shapes = sorted;
      fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n');
      console.log(`  ✓ reordered (wrote ${jsonPath.split('/').pop()})`);
      totalFixed++;
    } else {
      console.log(`  ~ already sorted correctly (no change written)`);
    }
  }
});

console.log(`\n─────────────────────────────────`);
console.log(`area-ratio threshold: ${areaRatioThreshold}  |  total suspects: ${totalFlags}`);
if (apply) console.log(`files reordered: ${totalFixed}`);
if (totalFlags === 0) console.log('No ordering issues detected.');
else if (!apply) console.log('Rerun with --apply to fix ordering. Review result visually after.');
if (exitCode && totalFlags > 0) process.exit(1);
