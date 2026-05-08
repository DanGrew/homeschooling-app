#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const outputFile = process.argv[2];
if (!outputFile) {
  console.error('Usage: node check-manifest-files.js <outputFile>');
  process.exit(1);
}

const ROOT = process.cwd();
const violations = [];
let scanned = 0;

function exists(p) { return fs.existsSync(p); }
function readJSON(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } }
function subdirs(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
}

// --- puzzle ---
(function checkPuzzle() {
  const manifestPath = path.join(ROOT, 'app/activities/puzzle/manifest.json');
  const filesDir = path.join(ROOT, 'app/activities/puzzle/files');
  const manifest = readJSON(manifestPath);
  if (!manifest) { violations.push('puzzle manifest.json — invalid JSON'); return; }
  manifest.forEach(entry => {
    scanned++;
    const dir = path.join(filesDir, entry.id);
    if (!exists(dir)) {
      violations.push(`puzzle/${entry.id} — directory missing`);
      return;
    }
    if (!exists(path.join(dir, 'full.jpg'))) {
      violations.push(`puzzle/${entry.id} — full.jpg missing`);
    }
  });
})();

// --- story-time ---
(function checkStoryTime() {
  const storyRoot = path.join(ROOT, 'app/activities/story-time');
  subdirs(storyRoot).forEach(story => {
    const audioDir = path.join(storyRoot, story, 'audio');
    if (!exists(audioDir)) {
      scanned++;
      violations.push(`story-time/${story} — audio/ directory missing`);
      return;
    }
    const jsonFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.json'));
    jsonFiles.forEach(jsonFile => {
      scanned++;
      const jsonPath = path.join(audioDir, jsonFile);
      const mp3 = jsonFile.replace('.json', '.mp3');
      const mp3Path = path.join(audioDir, mp3);
      if (!readJSON(jsonPath)) {
        violations.push(`story-time/${story}/audio/${jsonFile} — invalid JSON`);
      }
      if (!exists(mp3Path)) {
        violations.push(`story-time/${story}/audio/${mp3} — audio file missing`);
      }
    });
  });
})();

// --- simulator ---
(function checkSimulator() {
  const simsDir = path.join(ROOT, 'app/activities/simulator/sims');
  const spritesDir = path.join(ROOT, 'app/activities/simulator/sprites');
  if (!exists(spritesDir)) {
    violations.push('simulator — sprites/ directory missing');
  }
  if (!exists(simsDir)) return;
  fs.readdirSync(simsDir).filter(f => f.endsWith('.json')).forEach(file => {
    scanned++;
    const data = readJSON(path.join(simsDir, file));
    if (!data) {
      violations.push(`simulator/sims/${file} — invalid JSON`);
    } else if (!data.simulation || !data.scene || !data.objects) {
      violations.push(`simulator/sims/${file} — missing required keys (simulation/scene/objects)`);
    }
  });
})();

let output = `## check-manifest-files\n`;
if (violations.length === 0) {
  output += `✅ No issues (scanned ${scanned} entries)\n`;
} else {
  output += `❌ Violations (scanned ${scanned} entries):\n`;
  violations.forEach(v => output += `- ${v}\n`);
}

fs.writeFileSync(outputFile, output);
console.log(output);
process.exit(violations.length > 0 ? 1 : 0);
