#!/usr/bin/env node
// Detects suspicious z-order in colouring.json files.
// SVG painter algorithm: shapes render in array order, later = on top.
// Flags pairs where a shape rendered on top has a much larger bounding box
// than the shape below it AND they overlap — a large shape covering a detail.
// Also flags colourable shapes rendered on top of noColour/fixed shapes.
//
// Usage:
//   node scripts/check-colouring-zorder.js
//   node scripts/check-colouring-zorder.js --concept bird
//   node scripts/check-colouring-zorder.js --area-ratio 3.0

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let filterConcept = null;
let areaRatioThreshold = 2.0;
let exitCode = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--concept' && args[i + 1]) filterConcept = args[++i];
  if (args[i] === '--area-ratio' && args[i + 1]) areaRatioThreshold = parseFloat(args[++i]);
  if (args[i] === '--exit-code') exitCode = true;
}

const entriesDir = path.join(__dirname, '..', 'content', 'dictionary', 'entries');

// Parse SVG path d attribute into absolute coordinate points.
// Handles M/L/H/V/C/Q/A/Z (upper=absolute, lower=relative).
// Returns array of {x, y} endpoint positions (approximation — control points excluded).
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

const concepts = fs.readdirSync(entriesDir)
  .filter(d => fs.existsSync(path.join(entriesDir, d, 'colouring.json')))
  .filter(d => !filterConcept || d === filterConcept);

let totalFlags = 0;

concepts.forEach(concept => {
  const jsonPath = path.join(entriesDir, concept, 'colouring.json');
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const shapes = json.shapes || [];

  const bboxes = shapes.map(s => shapeBbox(s));
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

      // Flag 1: large shape on top of small shape (area ratio exceeded, significant overlap)
      if (areaI > 0 && areaJ / areaI > areaRatioThreshold && ovRatio > 0.3) {
        flags.push({
          type: 'large-on-small',
          below: si.id, above: sj.id,
          ratio: (areaJ / areaI).toFixed(1),
          overlap: (ovRatio * 100).toFixed(0) + '%',
        });
      }

      // Flag 2: colourable shape rendered on top of a noColour/fixed shape that it's covering.
      // Only suspicious when colourable is similar size or larger — a smaller colourable detail
      // sitting on top of a fixed base is intentional (e.g. pupil on eye ring).
      if (si.noColour && !sj.noColour && ovRatio > 0.2 && areaJ >= areaI * 0.7) {
        flags.push({
          type: 'colourable-over-fixed',
          below: si.id + ' (fixed)', above: sj.id,
          overlap: (ovRatio * 100).toFixed(0) + '%',
        });
      }
    }
  }

  if (flags.length) {
    console.log(`\n${concept.toUpperCase()} — ${flags.length} suspect(s)`);
    flags.forEach(f => {
      if (f.type === 'large-on-small') {
        console.log(`  [large-on-small]     ${f.below} below, ${f.above} on top  (${f.ratio}x area, ${f.overlap} overlap)`);
      } else {
        console.log(`  [colourable-over-fixed] ${f.below} below, ${f.above} on top  (${f.overlap} overlap)`);
      }
    });
    totalFlags += flags.length;
  }
});

console.log(`\n─────────────────────────────────`);
console.log(`area-ratio threshold: ${areaRatioThreshold}  |  total suspects: ${totalFlags}`);
if (totalFlags === 0) console.log('No ordering issues detected.');
else console.log('Review flagged pairs — larger shape rendered on top of smaller may obscure it.');
if (exitCode && totalFlags > 0) process.exit(1);
