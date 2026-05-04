#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appDir = path.join(root, 'app');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const PREFIX = '/homeschooling-app/app/';

const htmlFiles = walk(appDir);
let changed = 0;

for (const file of htmlFiles) {
  const rel = path.relative(appDir, file);
  const depth = rel.split(path.sep).length - 1; // depth from app/
  const up = depth === 0 ? '' : '../'.repeat(depth);

  const original = fs.readFileSync(file, 'utf8');
  const updated = original.replaceAll(PREFIX, up);

  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    const count = (original.match(new RegExp(PREFIX.replace(/\//g, '\\/'), 'g')) || []).length;
    console.log(`  ${rel} — ${count} replacement(s), prefix="${up || '(none)'}"`);
    changed++;
  }
}

console.log(`\nDone. ${changed} file(s) updated.`);
