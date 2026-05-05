#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rule = process.argv[2];
const outputFile = process.argv[3];

if (!rule || !outputFile) {
  console.error("Usage: node arch-check.js <rule> <outputFile>");
  process.exit(1);
}

const ROOT = process.cwd();

function getAllFiles(dir, ext = ['.js']) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(full, ext));
    } else if (ext.includes(path.extname(full))) {
      results.push(full);
    }
  });
  return results;
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

let violations = [];
let exceptions = [];
let scanned = [];

function hasAllow(content, tag) {
  return content.includes(`arch: ${tag}`);
}

if (rule === 'no-dom-in-core') {
  const files = getAllFiles(path.join(ROOT, 'core'));
  files.forEach(file => {
    const content = read(file);
    if (hasAllow(content, 'allow-dom')) {
      exceptions.push(file);
      return;
    }
    scanned.push(file);
    if (/\bdocument\b/.test(content) || /\bwindow\b/.test(content)) {
      violations.push(`${file} uses DOM globals`);
    }
  });
}

if (rule === 'no-ui-imports') {
  const files = getAllFiles(path.join(ROOT, 'core'));
  files.forEach(file => {
    const content = read(file);
    if (hasAllow(content, 'allow-import')) {
      exceptions.push(file);
      return;
    }
    scanned.push(file);
    if (content.match(/from ['"].*\/ui\//)) {
      violations.push(`${file} imports from /ui`);
    }
  });
}

if (rule === 'no-stray-files') {
  const EXCLUDED = new Set(['scripts', 'tests', '.github', 'node_modules', 'coverage', 'reports', '.claude']);
  const LAYERS = new Set(['core', 'ui', 'app']);
  const allFiles = getAllFiles(ROOT);
  allFiles.forEach(file => {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const parts = rel.split('/');
    if (parts.length === 1) return; // root-level config files (vitest.config.js etc.)
    const topDir = parts[0];
    if (EXCLUDED.has(topDir)) return;
    scanned.push(file);
    if (!LAYERS.has(topDir)) {
      violations.push(`${rel} is outside a recognised layer (core/ui/app)`);
    }
  });
}

if (rule === 'no-app-exports') {
  const files = getAllFiles(path.join(ROOT, 'app'));
  files.forEach(file => {
    const content = read(file);
    if (hasAllow(content, 'allow-export')) {
      exceptions.push(file);
      return;
    }
    scanned.push(file);
    if (/^export\s/m.test(content)) {
      violations.push(`${path.relative(ROOT, file).replace(/\\/g, '/')} exports from app/ (move to core/ or ui/)`);
    }
  });
}

let output = `## ${rule}\n`;

if (violations.length === 0) {
  output += `✅ No issues (scanned ${scanned.length} files)\n`;
} else {
  output += `❌ Violations (scanned ${scanned.length} files):\n`;
  violations.forEach(v => output += `- ${v}\n`);
}

if (exceptions.length > 0) {
  output += "\n⚠️ Exceptions:\n";
  exceptions.forEach(e => output += `- ${e}\n`);
}

fs.writeFileSync(outputFile, output);
console.log(output);

process.exit(violations.length > 0 ? 1 : 0);
