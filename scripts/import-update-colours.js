#!/usr/bin/env node
// Reads all JS files from scripts/update-colours/, converts to colouring.json format,
// and updates app/dictionary/entries/<concept>/colouring.json in-place.

const fs = require('fs');
const path = require('path');

const updateDir = path.join(__dirname, 'update-colours');
const entriesDir = path.join(__dirname, '..', 'app', 'dictionary', 'entries');

const jsFiles = fs.readdirSync(updateDir).filter(f => f.endsWith('.js'));

jsFiles.forEach(function(filename) {
  const jsPath = path.join(updateDir, filename);
  const code = fs.readFileSync(jsPath, 'utf8');

  const pictures = [];
  try {
    // eslint-disable-next-line no-new-func
    (new Function('pictures', code))(pictures);
  } catch (e) {
    console.error(`ERR ${filename}: failed to parse — ${e.message}`);
    return;
  }

  if (!pictures.length) { console.warn(`SKIP ${filename}: no picture found`); return; }

  const pic = pictures[0];
  const concept = pic.name.toLowerCase();
  const vb = pic.vb;

  const shapes = pic.shapes.map(function(s, i) {
    const shape = { id: 'shape_' + (i + 1), tag: s.tag, attrs: s.attrs };
    if (s.colour !== undefined) shape.colour = s.colour;
    if (s.noColour) shape.noColour = true;
    if (s.fixed) shape.fixed = true;
    return shape;
  });

  const jsonPath = path.join(entriesDir, concept, 'colouring.json');
  if (!fs.existsSync(jsonPath)) {
    console.warn(`SKIP ${concept}: no colouring.json at ${jsonPath}`);
    return;
  }

  const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  existing.viewBox = vb;
  existing.shapes = shapes;

  fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2) + '\n');
  console.log(`OK  ${concept}: ${shapes.length} shapes`);
});
