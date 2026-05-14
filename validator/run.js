'use strict';

const fs   = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { PAGES } = require('./config.js');
const { check: checkMenuBar } = require('./rules/menuBar.js');
const { check: checkSpeakableUI } = require('./rules/speakableUI.js');
const { report } = require('./reporter.js');

const ROOT = path.resolve(__dirname, '..');

function findHtml(dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtml(full, found);
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

function relPath(abs) {
  return abs.replace(ROOT + path.sep, '').replace(/\\/g, '/');
}

function validate(rel, html) {
  const { window } = new JSDOM(html);
  const doc = window.document;
  const errors = [];

  errors.push(...checkMenuBar(doc).map(e => `[menuBar] ${e}`));
  errors.push(...checkSpeakableUI(doc, html).map(e => `[speakableUI] ${e}`));

  return errors;
}

const htmlFiles = findHtml(path.join(ROOT, 'app'));
const results = [];
const unknown = [];

console.log('\nPage Contract Validator\n');

for (const abs of htmlFiles) {
  const rel = relPath(abs);
  const entry = PAGES[rel];

  if (!entry) { unknown.push(rel); continue; }

  const type = typeof entry === 'string' ? entry : entry.type;

  if (type === 'hub') continue;

  if (type === 'exempt') {
    console.log(`  \u23ed  ${rel} (exempt: ${entry.reason})`);
    continue;
  }

  const html = fs.readFileSync(abs, 'utf8');
  results.push({ file: rel, errors: validate(rel, html) });
}

if (unknown.length) {
  console.log('\n\u26a0  Unclassified pages (add to validator/config.js):');
  unknown.forEach(f => console.log(`   ${f}`));
  console.log('');
}

const totalErrors = report(results);
const exitCode = (totalErrors > 0 || unknown.length > 0) ? 1 : 0;
process.exit(exitCode);
