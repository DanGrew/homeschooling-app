#!/usr/bin/env node
// Syncs colouring.json shape order to the original SVG document order.
//
// SVG elements render in document order (painter's algorithm: later = on top).
// The colouring.json shapes array must match that order for correct layering.
// This script uses the source SVG files as ground truth instead of heuristics.
//
// ## How it works
// 1. Scans all SVG files under the designs root directory.
// 2. For each colouring.json, finds the source SVG by matching shape attributes
//    (path `d`, circle cx/cy/r, ellipse cx/cy/rx/ry, polyline points).
// 3. Sorts the shapes array to match SVG document element order.
// 4. Shapes not found in the SVG (manually added) are appended in their
//    original relative order after all matched shapes.
//
// ## Usage
//   node scripts/sync-colouring-zorder-from-svg.js
//   node scripts/sync-colouring-zorder-from-svg.js --concept camel
//   node scripts/sync-colouring-zorder-from-svg.js --apply
//   node scripts/sync-colouring-zorder-from-svg.js --apply --concept bull
//   node scripts/sync-colouring-zorder-from-svg.js --designs /path/to/designs
//
//   npm run sync:zorder
//   npm run sync:zorder -- --apply

const fs   = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const args = process.argv.slice(2);
let filterConcept = null;
let apply = false;
let designsRoot = path.join(__dirname, '..', '..', 'homeschooling', 'designs');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--concept'  && args[i + 1]) filterConcept = args[++i];
  if (args[i] === '--apply')   apply = true;
  if (args[i] === '--designs'  && args[i + 1]) designsRoot = args[++i];
}

if (!fs.existsSync(designsRoot)) {
  console.error(`Designs root not found: ${designsRoot}`);
  console.error('Pass --designs /path/to/designs/folder');
  process.exit(1);
}

const entriesDir = path.join(__dirname, '..', 'content', 'dictionary', 'entries');

// ── SVG parsing ──────────────────────────────────────────────────────────────

const SHAPE_TAGS = ['path', 'circle', 'ellipse', 'rect', 'polyline', 'polygon', 'line'];

function parseSvgElements(svgPath) {
  const content = fs.readFileSync(svgPath, 'utf8');
  const dom = new JSDOM(content, { contentType: 'image/svg+xml' });
  const doc = dom.window.document;
  return [...doc.querySelectorAll(SHAPE_TAGS.join(','))].map(el => ({
    tag: el.tagName.toLowerCase(),
    attrs: Object.fromEntries(
      [...el.attributes].map(a => [a.name, a.value])
    ),
  }));
}

// ── Matching ─────────────────────────────────────────────────────────────────

function normalizeD(d) {
  return (d || '').trim().replace(/\s+/g, ' ');
}

function matchKey(tag, attrs) {
  switch (tag) {
    case 'path':     return 'path:' + normalizeD(attrs.d);
    case 'circle':   return `circle:${attrs.cx},${attrs.cy},${attrs.r}`;
    case 'ellipse':  return `ellipse:${attrs.cx},${attrs.cy},${attrs.rx},${attrs.ry}`;
    case 'polyline': return 'polyline:' + normalizeD(attrs.points);
    case 'polygon':  return 'polygon:'  + normalizeD(attrs.points);
    case 'rect':     return `rect:${attrs.x},${attrs.y},${attrs.width},${attrs.height}`;
    case 'line':     return `line:${attrs.x1},${attrs.y1},${attrs.x2},${attrs.y2}`;
    default:         return tag + ':' + JSON.stringify(attrs);
  }
}

// ── Load all SVG files ───────────────────────────────────────────────────────

const allSvgFiles = [];
function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scanDir(full);
    else if (f.endsWith('.svg')) allSvgFiles.push(full);
  });
}
scanDir(designsRoot);

// Parse + index each SVG: Map<matchKey → svgElementIndex>
const svgData = allSvgFiles.map(svgPath => {
  try {
    const elements = parseSvgElements(svgPath);
    const index = new Map(elements.map((el, i) => [matchKey(el.tag, el.attrs), i]));
    return { svgPath, elements, index };
  } catch (e) {
    return null;
  }
}).filter(Boolean);

// ── Per-concept processing ───────────────────────────────────────────────────

const concepts = fs.readdirSync(entriesDir)
  .filter(d => fs.existsSync(path.join(entriesDir, d, 'colouring.json')))
  .filter(d => !filterConcept || d === filterConcept);

let totalChanged = 0;
let totalNoMatch = 0;

concepts.forEach(concept => {
  const jsonPath = path.join(entriesDir, concept, 'colouring.json');
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const shapes = json.shapes || [];

  // Build match keys for each shape
  const shapeKeys = shapes.map(s => matchKey(s.tag, s.attrs));

  // Find the SVG with the highest number of matching shapes
  let bestSvg = null, bestScore = 0;
  svgData.forEach(svg => {
    const score = shapeKeys.filter(k => svg.index.has(k)).length;
    if (score > bestScore) { bestScore = score; bestSvg = svg; }
  });

  const matchRatio = bestScore / shapes.length;

  if (!bestSvg || matchRatio < 0.5) {
    console.log(`\n${concept.toUpperCase()} — no source SVG found (best match: ${bestScore}/${shapes.length})`);
    totalNoMatch++;
    return;
  }

  const svgName = path.relative(designsRoot, bestSvg.svgPath);

  // Sort matched shapes by SVG element index; unmatched go to end in original order
  const matched   = shapes.filter(s =>  bestSvg.index.has(matchKey(s.tag, s.attrs)));
  const unmatched = shapes.filter(s => !bestSvg.index.has(matchKey(s.tag, s.attrs)));

  matched.sort((a, b) =>
    bestSvg.index.get(matchKey(a.tag, a.attrs)) -
    bestSvg.index.get(matchKey(b.tag, b.attrs))
  );

  const sorted = [...matched, ...unmatched];
  const changed = sorted.some((s, i) => s.id !== shapes[i].id);

  if (!changed) {
    console.log(`\n${concept.toUpperCase()} — already correct (${svgName})`);
    return;
  }

  console.log(`\n${concept.toUpperCase()} — reorder needed (${bestScore}/${shapes.length} matched, source: ${svgName})`);
  console.log(`  before: ${shapes.map(s => s.id).join(', ')}`);
  console.log(`  after:  ${sorted.map(s => s.id).join(', ')}`);
  if (unmatched.length) {
    console.log(`  unmatched (appended): ${unmatched.map(s => s.id).join(', ')}`);
  }

  totalChanged++;

  if (apply) {
    json.shapes = sorted;
    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n');
    console.log(`  ✓ written`);
  }
});

console.log(`\n─────────────────────────────────`);
console.log(`concepts needing reorder: ${totalChanged}  |  no SVG found: ${totalNoMatch}`);
if (totalChanged > 0 && !apply) console.log('Rerun with --apply to write changes.');
if (totalChanged === 0 && totalNoMatch === 0) console.log('All concepts already match SVG order.');
