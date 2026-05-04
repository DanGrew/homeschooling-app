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
    if (content.includes('document') || content.includes('window')) {
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
    if (content.match(/from ['"].*\/ui\//)) {
      violations.push(`${file} imports from /ui`);
    }
  });
}

if (rule === 'ui-complexity') {
  const files = getAllFiles(path.join(ROOT, 'ui'));
  files.forEach(file => {
    const content = read(file);
    if (hasAllow(content, 'allow-complexity')) {
      exceptions.push(file);
      return;
    }

    const lines = content.split('\n').length;
    const ifs = (content.match(/if\s*\(/g) || []).length;

    if (lines > 80 || ifs > 5) {
      violations.push(`${file} high complexity (lines:${lines}, ifs:${ifs})`);
    }
  });
}

let output = `## ${rule}\n`;

if (violations.length === 0) {
  output += "✅ No issues\n";
} else {
  output += "❌ Violations:\n";
  violations.forEach(v => output += `- ${v}\n`);
}

if (exceptions.length > 0) {
  output += "\n⚠️ Exceptions:\n";
  exceptions.forEach(e => output += `- ${e}\n`);
}

fs.writeFileSync(outputFile, output);
console.log(output);

process.exit(violations.length > 0 ? 1 : 0);
