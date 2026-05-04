#!/usr/bin/env node
// Scans app/**/*-logic.js and reports files with no reference in any tests/unit test.
// Only *-logic.js files are in scope — DOM-coupled files are intentionally excluded.
// Exits 1 if any logic file is untested.

const fs = require('fs');
const path = require('path');

function walkLogic(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkLogic(full, out);
    else if (entry.name.endsWith('-logic.js')) out.push(full);
  }
  return out;
}

function walkAll(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkAll(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const root = path.resolve(__dirname, '..');
const logicFiles = walkLogic(path.join(root, 'app'))
  .map(f => path.relative(root, f).replace(/\\/g, '/'));

const testFiles = walkAll(path.join(root, 'tests', 'unit'));
const testContent = testFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const untested = logicFiles.filter(f => {
  const basename = path.basename(f);
  return !testContent.includes(basename);
});

if (untested.length === 0) {
  console.log('check:untested — all *-logic.js files referenced in unit tests.');
  process.exit(0);
}

console.log(`check:untested — ${untested.length} logic file(s) with no unit test coverage:\n`);
untested.forEach(f => console.log(`  ${f}`));
console.log('\nAdd unit tests for each file listed above.');
process.exit(1);
