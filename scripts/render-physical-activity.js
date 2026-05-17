#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST = path.join(ROOT, 'content/physical/activities/index.json');
const ACTIVITIES_HTML = path.join(ROOT, 'app/physical/activities');
const SHELL = path.join(ROOT, 'app/physical/activities/_shell.html');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const shell = fs.readFileSync(SHELL, 'utf8');

const args = process.argv.slice(2);
const target = args[0];

const entries = target
  ? manifest.filter(e => e.file === target + '.json')
  : manifest;

if (!entries.length) {
  console.log('No matching entries in manifest.');
  process.exit(0);
}

entries.forEach(entry => {
  const name = entry.file.replace('.json', '');
  const outDir = path.join(ACTIVITIES_HTML, name);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), shell);
  console.log(`Scaffolded: app/physical/activities/${name}/index.html`);
});
