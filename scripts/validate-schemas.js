#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const outputFile = process.argv[2];
if (!outputFile) {
  console.error('Usage: node validate-schemas.js <outputFile>');
  process.exit(1);
}

const ROOT = process.cwd();
const ajv = new Ajv({ allErrors: true });
const lines = [];

function log(line) {
  lines.push(line);
  console.log(line);
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function findFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(full, predicate));
    else if (predicate(entry.name, full)) results.push(full);
  }
  return results;
}

function inDir(segment) {
  return (_, full) => full.replace(/\\/g, '/').includes(segment);
}

const MAPPINGS = [
  {
    label: 'dictionary/concept',
    schema: 'app/schemas/dictionary/concept.schema.json',
    searchDir: 'app/dictionary/entries',
    match: (name) => name === 'concept.json'
  },
  {
    label: 'dictionary/image',
    schema: 'app/schemas/dictionary/image.schema.json',
    searchDir: 'app/dictionary/entries',
    match: (name) => name === 'image.json'
  },
  {
    label: 'dictionary/colouring',
    schema: 'app/schemas/dictionary/colouring.schema.json',
    searchDir: 'app/dictionary/entries',
    match: (name) => name === 'colouring.json'
  },
  {
    label: 'dictionary/connect-dots',
    schema: 'app/schemas/dictionary/connect-dots.schema.json',
    searchDir: 'app/dictionary/entries',
    match: (name) => name === 'connect-dots.json'
  },
  {
    label: 'routine',
    schema: 'app/schemas/routine/routine.schema.json',
    searchDir: 'app/routine/data',
    match: (name) => name.endsWith('.json')
  },
  {
    label: 'activities/puzzle-manifest',
    schema: 'app/schemas/activities/puzzle-manifest.schema.json',
    searchDir: 'app/activities/puzzle',
    match: (name) => name === 'manifest.json'
  },
  {
    label: 'activities/catalog',
    schema: 'app/schemas/activities/catalog.schema.json',
    searchDir: 'app/activities/shopping-play/catalogs',
    match: (name) => name.endsWith('.json')
  },
  {
    label: 'activities/story-audio',
    schema: 'app/schemas/activities/story-audio.schema.json',
    searchDir: 'app/activities/story-time',
    match: (name, full) => full.replace(/\\/g, '/').includes('/audio/') && name.endsWith('.json')
  },
  {
    label: 'content/colour-wheel-lessons',
    schema: 'app/schemas/content/colour-wheel-lessons.schema.json',
    searchDir: 'content/lessons',
    match: (name) => name === 'colour-wheel.json'
  }
];

let totalErrors = 0;
let totalChecked = 0;

for (const { label, schema, searchDir, match } of MAPPINGS) {
  const schemaObj = readJSON(path.join(ROOT, schema));
  const validate = ajv.compile(schemaObj);
  const files = findFiles(path.join(ROOT, searchDir), match);

  let groupErrors = 0;
  for (const file of files) {
    totalChecked++;
    const data = readJSON(file);
    if (!validate(data)) {
      groupErrors++;
      totalErrors++;
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      for (const err of validate.errors) {
        log(`✗ ${rel}: ${err.instancePath || '(root)'} ${err.message}`);
      }
    }
  }

  log(`${groupErrors === 0 ? '✓' : '✗'} ${label} — ${files.length} file(s), ${groupErrors} error(s)`);
}

log('');
if (totalErrors > 0) {
  log(`FAIL: ${totalErrors} validation error(s) across ${totalChecked} files`);
} else {
  log(`PASS: ${totalChecked} files validated against schema`);
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, lines.join('\n') + '\n');

if (totalErrors > 0) process.exit(1);
