'use strict';

const fs   = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { check: checkMenuBar } = require('./rules/menuBar.js');
const { check: checkSpeakableUI } = require('./rules/speakableUI.js');
const { report } = require('./reporter.js');

const ROOT = path.resolve(__dirname, '..', '..');

function classify(rel) {
  return rel.startsWith('app/') ? 'activity' : 'hub';
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

function contractName(rel) {
  // app/activities/simulator/index.html             -> simulator
  // app/activities/piano/game.html                  -> piano-game
  // app/worksheets/colouring-sheets/index.html      -> colouring-sheets
  // app/physical/index.html                         -> physical
  // app/physical/activities/rope-rescue/index.html  -> physical-rope-rescue
  // app/curriculum/index.html                       -> curriculum
  // app/index.html                                  -> index
  let stripped = rel.replace(/^app\//, '');
  stripped = stripped.replace(/^(activities|worksheets)\//, '');
  stripped = stripped.replace(/\/activities\//, '/');
  const parts = stripped.split('/');
  if (parts.length === 1) return path.basename(parts[0], '.html');
  const dirs = parts.slice(0, -1);
  const file = path.basename(parts[parts.length - 1], '.html');
  const dirPart = dirs.join('-');
  return file === 'index' ? dirPart : `${dirPart}-${file}`;
}

function loadOptOuts(abs, rel) {
  const contractPath = path.join(ROOT, 'content', 'contracts', contractName(rel) + '.json');
  if (!fs.existsSync(contractPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(contractPath, 'utf8'))['opt-outs'] || {};
  } catch (e) {
    return {};
  }
}

function validate(html, optOuts) {
  const { window } = new JSDOM(html);
  const doc = window.document;
  const errors = [];
  errors.push(...checkMenuBar(doc, optOuts).map(e => `[menuBar] ${e}`));
  errors.push(...checkSpeakableUI(doc, html, optOuts).map(e => `[speakableUI] ${e}`));
  return errors;
}

const filterFiles = process.argv.slice(2).map(f => f.replace(/\\/g, '/'));
const allHtmlFiles = findHtml(path.join(ROOT, 'app'));
const results = [];

console.log('\nPage Contract Validator\n');

for (const abs of allHtmlFiles) {
  const rel = relPath(abs);
  if (classify(rel) !== 'activity') continue;
  if (filterFiles.length > 0 && !filterFiles.includes(rel)) continue;
  const html = fs.readFileSync(abs, 'utf8');
  const optOuts = loadOptOuts(abs, rel);
  results.push({ file: rel, errors: validate(html, optOuts) });
}

const totalErrors = report(results);
process.exit(totalErrors > 0 ? 1 : 0);
