#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LESSONS_DIR = path.join(ROOT, 'content', 'lessons');
const APP_DIR = path.join(ROOT, 'app');

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.name.endsWith('.html')) out.push(fs.readFileSync(full, 'utf8'));
  }
  return out;
}

const allHtml = walkHtml(APP_DIR).join('\n');

const lessonFiles = fs.readdirSync(LESSONS_DIR)
  .filter(f => f.endsWith('.json') && f !== 'index.json');

const unreachable = lessonFiles.filter(f => {
  const id = f.replace('.json', '');
  return !allHtml.includes("ACTIVITY_ID = '" + id + "'") &&
         !allHtml.includes('ACTIVITY_ID = "' + id + '"') &&
         !allHtml.includes("ACTIVITY_ID='" + id + "'") &&
         !allHtml.includes('ACTIVITY_ID="' + id + '"');
});

if (unreachable.length === 0) {
  console.log('check:lesson-json-reachable — all lesson JSONs referenced by an activity.');
  console.log('\nSUMMARY: ✅ 0 / ' + lessonFiles.length + ' files');
  process.exit(0);
}

console.log('check:lesson-json-reachable — ' + unreachable.length + ' lesson JSON(s) not referenced:\n');
unreachable.forEach(f => console.log('  content/lessons/' + f));
console.log('\nAdd ACTIVITY_ID to an activity page or remove the unused lesson JSON.');
console.log('\nSUMMARY: ❌ ' + unreachable.length + ' / ' + lessonFiles.length + ' files');
process.exit(1);
