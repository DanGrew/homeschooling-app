#!/usr/bin/env node
// Scans app/**/*.js and reports files with no reference in any tests/unit test.
// Exits 0 (warning only) — does not fail the build.

const fs = require('fs');
const path = require('path');

const IGNORE = [
  // Static data — no logic to test
  'app/shared/colouring-pictures',
  'app/activities/connect-the-dots/shapes',
  'app/activities/connect-the-dots/free-svg',
  'app/activities/story-time/data.js',

  // DOM/canvas/audio-coupled — covered by Playwright E2E
  'app/shared/trace-engine.js',
  'app/shared/colouring-common.js',
  'app/shared/piano-shared.js',
  'app/shared/menu.js',
  'app/shared/shapes.js',
  'app/activities/simulator/engine/loader.js',
  'app/activities/story-time/player.js',
  'app/activities/drawing-dots/engine.js',
  'app/activities/simulator/engine/engine.js',
];

function walk(dir, ext, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

const root = path.resolve(__dirname, '..');
const appFiles = walk(path.join(root, 'app'), '.js')
  .map(f => path.relative(root, f).replace(/\\/g, '/'))
  .filter(f => !IGNORE.some(ig => f.startsWith(ig) || f === ig));

const testFiles = walk(path.join(root, 'tests', 'unit'), '.js');
const testContent = testFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');

const untested = appFiles.filter(f => {
  const basename = path.basename(f);
  return !testContent.includes(basename);
});

if (untested.length === 0) {
  console.log('check:untested — all app JS files referenced in unit tests.');
  process.exit(0);
}

console.log(`check:untested — ${untested.length} file(s) with no unit test coverage:\n`);
untested.forEach(f => console.log(`  ${f}`));
console.log('\nConsider adding unit tests or adding to the ignore list in scripts/check-untested.js');
process.exit(0); // warning only — does not fail CI
