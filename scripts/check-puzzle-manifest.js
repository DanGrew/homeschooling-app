#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const outputFile = process.argv[2];
if (!outputFile) {
  console.error('Usage: node check-puzzle-manifest.js <outputFile>');
  process.exit(1);
}

const ROOT = process.cwd();
const manifestPath = path.join(ROOT, 'app/activities/puzzle/manifest.json');
const filesDir = path.join(ROOT, 'app/activities/puzzle/files');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const violations = [];
let scanned = 0;

manifest.forEach(entry => {
  scanned++;
  const dir = path.join(filesDir, entry.id);
  if (!fs.existsSync(dir)) {
    violations.push(`${entry.id} — directory missing: app/activities/puzzle/files/${entry.id}/`);
    return;
  }
  if (!fs.existsSync(path.join(dir, 'full.jpg'))) {
    violations.push(`${entry.id} — full.jpg missing`);
  }
});

let output = `## check-puzzle-manifest\n`;
if (violations.length === 0) {
  output += `✅ No issues (scanned ${scanned} puzzles)\n`;
} else {
  output += `❌ Violations (scanned ${scanned} puzzles):\n`;
  violations.forEach(v => output += `- ${v}\n`);
}

fs.writeFileSync(outputFile, output);
console.log(output);
process.exit(violations.length > 0 ? 1 : 0);
