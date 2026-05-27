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
  const manifestPath = path.join(ROOT, 'content/puzzle/manifest.json');
  const manifest = readJSON(manifestPath);
  if (!manifest) { violations.push('puzzle manifest.json — invalid JSON'); return; }
  manifest.forEach(entry => {
    scanned++;
    if (!entry.image) {
      violations.push(`puzzle/${entry.id} — image field missing`);
      return;
    }
    const imgPath = path.join(ROOT, entry.image.replace(/^(\.\.\/)+/, ''));
    if (!exists(imgPath)) {
      violations.push(`puzzle/${entry.id} — image file missing at ${entry.image}`);
    }
  });
})();

// --- story-time ---
(function checkStoryTime() {
  const jsonRoot = path.join(ROOT, 'content/story-time');
  const audioRoot = path.join(ROOT, 'assets/story-time');
  subdirs(jsonRoot).forEach(story => {
    const jsonAudioDir = path.join(jsonRoot, story, 'audio');
    const mp3AudioDir = path.join(audioRoot, story, 'audio');
    if (!exists(jsonAudioDir)) {
      scanned++;
      violations.push(`story-time/${story} — content/story-time audio/ directory missing`);
      return;
    }
    const jsonFiles = fs.readdirSync(jsonAudioDir).filter(f => f.endsWith('.json'));
    jsonFiles.forEach(jsonFile => {
      scanned++;
      const jsonPath = path.join(jsonAudioDir, jsonFile);
      const mp3 = jsonFile.replace('.json', '.mp3');
      const mp3Path = path.join(mp3AudioDir, mp3);
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
  const simsDir = path.join(ROOT, 'content/simulator/sims');
  const spritesDir = path.join(ROOT, 'assets/simulator');
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

// --- paint backgrounds ---
(function checkPaintBackgrounds() {
  const manifestPath = path.join(ROOT, 'content/paint-playground/backgrounds.json');
  const configPath = path.join(ROOT, 'content/paint-playground/backgrounds.config.json');
  const config = exists(configPath) ? readJSON(configPath) : {};
  const sourceRel = (config && config.source) || 'assets/paint-playground/backgrounds';
  const bgDir = path.join(ROOT, sourceRel);
  const manifest = readJSON(manifestPath);
  if (!manifest) { violations.push('paint-playground/backgrounds.json — invalid JSON or missing'); return; }
  manifest.forEach(entry => {
    scanned++;
    const filePath = path.join(ROOT, entry.path.replace('../../../', ''));
    if (!exists(filePath)) violations.push(`${entry.path} — file missing`);
  });
  if (exists(bgDir)) {
    const actualFiles = fs.readdirSync(bgDir).filter(f => /\.(png|jpe?g)$/i.test(f)).sort();
    const manifestFiles = new Set(manifest.map(e => e.path.split('/').pop()));
    actualFiles.forEach(f => {
      if (!manifestFiles.has(f)) violations.push(`paint-playground/backgrounds/${f} — not in manifest`);
    });
  }
})();

// --- shared images ---
(function checkSharedImages() {
  const manifestPath = path.join(ROOT, 'content/shared/images/manifest.json');
  const filesDir = path.join(ROOT, 'assets/shared/images');
  const manifest = readJSON(manifestPath);
  if (!manifest) { violations.push('shared/images/manifest.json — invalid JSON or missing'); return; }
  const manifestIds = new Set();
  manifest.forEach(entry => {
    scanned++;
    manifestIds.add(entry.id);
    const filePath = path.join(ROOT, entry.path);
    if (!exists(filePath)) violations.push(`shared/images/${entry.id} — file missing at ${entry.path}`);
  });
  if (exists(filesDir)) {
    fs.readdirSync(filesDir).filter(f => /\.(png|jpe?g)$/i.test(f)).forEach(f => {
      const id = f.replace(/\.[^.]+$/, '');
      if (!manifestIds.has(id)) {
        scanned++;
        violations.push(`shared/images/${f} — file present but not in manifest`);
      }
    });
  }
})();

let output = `## check-manifest-files\n`;
if (violations.length === 0) {
  output += `✅ No issues (scanned ${scanned} entries)\n`;
} else {
  output += `❌ Violations (scanned ${scanned} entries):\n`;
  violations.forEach(v => output += `- ${v}\n`);
}

const manifestOk = violations.length === 0 && scanned > 0;
output += `\nSUMMARY: ${manifestOk ? '✅' : '❌'} ${violations.length} / ${scanned} entries\n`;

fs.writeFileSync(outputFile, output);
console.log(output);
process.exit(violations.length > 0 ? 1 : 0);
