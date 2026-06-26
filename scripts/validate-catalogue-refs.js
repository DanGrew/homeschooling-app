#!/usr/bin/env node

// Cross-file / filesystem reference checks for the Learning Catalogue that a
// per-file schema (scripts/validate-schemas.js) cannot express:
//   - learning.area matches the id of the area file it lives in
//   - every curriculum tag is a valid id from content/curriculum/criteria.json
//   - every playgrounds[].id is in the index registry AND has an app/activities/<id>/ dir
//   - every learningIcons id exists in the index registry
// Pure rules live in core/learning-catalogue/catalogue-refs-core.js (unit-tested);
// this script is the filesystem shell.

const fs = require('fs');
const path = require('path');
const { collectCriterionIds, validateLearning } = require('../core/learning-catalogue/catalogue-refs-core.js');

const outputFile = process.argv[2];
if (!outputFile) {
  console.error('Usage: node validate-catalogue-refs.js <outputFile>');
  process.exit(1);
}

const ROOT = process.cwd();
const CAT_DIR = path.join(ROOT, 'content/learning-catalogue');
const lines = [];

function log(line) {
  lines.push(line);
  console.log(line);
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const index = readJSON(path.join(CAT_DIR, 'index.json'));
const criteria = readJSON(path.join(ROOT, 'content/curriculum/criteria.json'));

const ctxBase = {
  criterionIds: collectCriterionIds(criteria),
  iconIds: index.learningIcons.map((i) => i.id),
  playgroundIds: Object.keys(index.playgrounds || {}),
  activityIds: fs
    .readdirSync(path.join(ROOT, 'app/activities'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
};

let totalErrors = 0;
let totalLearnings = 0;

for (const area of index.areas) {
  const file = path.join(CAT_DIR, area.file);
  if (!fs.existsSync(file)) {
    totalErrors++;
    log(`✗ index.json: area "${area.id}" references missing file "${area.file}"`);
    continue;
  }
  const data = readJSON(file);
  for (const learning of data.learnings) {
    totalLearnings++;
    const errs = validateLearning(learning, Object.assign({ areaId: area.id }, ctxBase));
    for (const err of errs) {
      totalErrors++;
      log(`✗ ${area.file}: ${err}`);
    }
  }
}

log('');
if (totalErrors > 0) {
  log(`FAIL: ${totalErrors} reference error(s) across ${totalLearnings} learnings`);
} else {
  log(`PASS: ${totalLearnings} learnings, all references resolve`);
}
log(`SUMMARY: ${totalErrors === 0 ? '✅' : '❌'} ${totalErrors} / ${totalLearnings} learnings`);

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, lines.join('\n') + '\n');

if (totalErrors > 0) process.exit(1);
