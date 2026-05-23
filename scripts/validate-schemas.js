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
    schema: 'content/schemas/dictionary/concept.schema.json',
    searchDir: 'content/dictionary/entries',
    match: (name) => name === 'concept.json'
  },
  {
    label: 'dictionary/image',
    schema: 'content/schemas/dictionary/image.schema.json',
    searchDir: 'content/dictionary/entries',
    match: (name) => name === 'image.json'
  },
  {
    label: 'dictionary/colouring',
    schema: 'content/schemas/dictionary/colouring.schema.json',
    searchDir: 'content/dictionary/entries',
    match: (name) => name === 'colouring.json'
  },
  {
    label: 'dictionary/connect-dots',
    schema: 'content/schemas/dictionary/connect-dots.schema.json',
    searchDir: 'content/dictionary/entries',
    match: (name) => name === 'connect-dots.json'
  },
  {
    label: 'dictionary/index',
    schema: 'content/schemas/dictionary/dictionary-index.schema.json',
    searchDir: 'content/dictionary',
    match: (name) => name === 'dictionary.json'
  },
  {
    label: 'routine',
    schema: 'content/schemas/routine/routine.schema.json',
    searchDir: 'content/routine',
    match: (name) => name.endsWith('.json')
  },
  {
    label: 'activities/puzzle-manifest',
    schema: 'content/schemas/activities/puzzle-manifest.schema.json',
    searchDir: 'content/puzzle',
    match: (name) => name === 'manifest.json'
  },
  {
    label: 'activities/shopping-scan-catalog',
    schema: 'content/schemas/activities/catalog.schema.json',
    searchDir: 'content/shopping-scan/catalogs',
    match: (name) => name.endsWith('.json')
  },
  {
    label: 'activities/story-audio',
    schema: 'content/schemas/activities/story-audio.schema.json',
    searchDir: 'content/story-time',
    match: (name, full) => full.replace(/\\/g, '/').includes('/audio/') && name.endsWith('.json')
  },
  {
    label: 'content/colour-wheel-lessons',
    schema: 'content/schemas/content/colour-wheel-lessons.schema.json',
    searchDir: 'content/lessons',
    match: (name) => name === 'colour-wheel.json'
  },
  {
    label: 'content/learnings',
    schema: 'content/schemas/content/learnings.schema.json',
    searchDir: 'content/learnings',
    match: (name) => name.endsWith('.json') && name !== 'manifest.json'
  },
  {
    label: 'content/logic-gates',
    schema: 'content/schemas/content/logic-gates.schema.json',
    searchDir: 'content/logic-gates',
    match: (name) => name.endsWith('.json')
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
log(`SUMMARY: ${totalErrors === 0 ? '✅' : '❌'} ${totalErrors} / ${totalChecked} files`);

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, lines.join('\n') + '\n');

if (totalErrors > 0) process.exit(1);
