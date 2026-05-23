#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LEARNINGS_DIR = path.join(ROOT, 'content', 'learnings');

const REQUIRED = ['id', 'title', 'source', 'criteria'];

const learningFiles = fs.readdirSync(LEARNINGS_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const errors = [];

learningFiles.forEach(function(f) {
  const id = f.replace('.json', '');
  const full = path.join(LEARNINGS_DIR, f);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch(e) {
    errors.push(f + ': invalid JSON — ' + e.message);
    return;
  }
  REQUIRED.forEach(function(field) {
    if (!data[field]) errors.push(f + ': missing required field "' + field + '"');
  });
  if (data.id && data.id !== id) {
    errors.push(f + ': id field "' + data.id + '" does not match filename');
  }
  if (data.criteria && !Array.isArray(data.criteria)) {
    errors.push(f + ': criteria must be an array');
  }
});

if (errors.length === 0) {
  console.log('check:learnings-reachable — all ' + learningFiles.length + ' learning files valid.');
  console.log('\nSUMMARY: ✅ 0 / ' + learningFiles.length + ' files');
  process.exit(0);
}

console.log('check:learnings-reachable — ' + errors.length + ' error(s):\n');
errors.forEach(function(e) { console.log('  ' + e); });
console.log('\nSUMMARY: ❌ ' + errors.length + ' error(s) in ' + learningFiles.length + ' files');
process.exit(1);
