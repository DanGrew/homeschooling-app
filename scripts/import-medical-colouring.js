#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const jsDir = 'C:/Users/danie/Documents/dan-grew-repos/homeschooling/designs/medical/vecteezy_nurse-vector-icon-set_110395_split';
const entriesDir = path.join(__dirname, '../app/dictionary/entries');

const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const concept = path.basename(file, '.js');
  const entryDir = path.join(entriesDir, concept);
  if (!fs.existsSync(entryDir)) { console.warn(`SKIP ${concept} — no entry dir`); continue; }

  const pictures = [];
  eval(fs.readFileSync(path.join(jsDir, file), 'utf8'));
  if (!pictures.length) { console.warn(`SKIP ${concept} — no pictures`); continue; }

  const shapes = pictures[0].shapes.map((s, i) => {
    const shape = { id: `shape_${i + 1}`, tag: s.tag, attrs: s.attrs };
    if (s.colour !== undefined) shape.colour = s.colour;
    if (s.noColour) shape.noColour = true;
    return shape;
  });

  const colouring = { concept, type: 'colouring', level: 1, viewBox: pictures[0].vb, shapes };
  const outPath = path.join(entryDir, 'colouring.json');
  fs.writeFileSync(outPath, JSON.stringify(colouring, null, 2) + '\n');
  console.log(`OK  ${concept}  (${shapes.length} shapes)`);
}
