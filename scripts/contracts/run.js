'use strict';

const fs   = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { check: checkMenuBar } = require('./rules/menuBar.js');
const { check: checkSpeakableUI } = require('./rules/speakableUI.js');
const { report } = require('./reporter.js');

const ROOT = path.resolve(__dirname, '..', '..');

function classify(rel) {
  if (rel.startsWith('app/activities/')) return 'activity';
  if (rel.startsWith('app/worksheets/') && rel !== 'app/worksheets/index.html') return 'activity';
  return 'hub';
}

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

function validate(html) {
  const { window } = new JSDOM(html);
  const doc = window.document;
  const errors = [];
  errors.push(...checkMenuBar(doc).map(e => `[menuBar] ${e}`));
  errors.push(...checkSpeakableUI(doc, html).map(e => `[speakableUI] ${e}`));
  return errors;
}

const htmlFiles = findHtml(path.join(ROOT, 'app'));
const results = [];

console.log('\nPage Contract Validator\n');

for (const abs of htmlFiles) {
  const rel = relPath(abs);
  if (classify(rel) !== 'activity') continue;
  const html = fs.readFileSync(abs, 'utf8');
  results.push({ file: rel, errors: validate(html) });
}

const totalErrors = report(results);
process.exit(totalErrors > 0 ? 1 : 0);
