const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, '..', 'content/dictionary');
const entriesDir = path.join(dictDir, 'entries');
const manifestsDir = path.join(dictDir, 'manifests');

if (!fs.existsSync(manifestsDir)) fs.mkdirSync(manifestsDir);

const animals = fs.readdirSync(entriesDir).filter(function(f) {
  return fs.statSync(path.join(entriesDir, f)).isDirectory();
});

var groups = {};

animals.forEach(function(id) {
  var animalDir = path.join(entriesDir, id);
  fs.readdirSync(animalDir).forEach(function(filename) {
    if (!filename.endsWith('.json')) return;
    if (filename === 'concept.json') return;
    var repFile = path.join(animalDir, filename);
    var rep;
    try { rep = JSON.parse(fs.readFileSync(repFile, 'utf8')); } catch(e) { return; }
    if (!rep.type || rep.level === undefined) return;
    var key = rep.type + '-level-' + rep.level;
    if (!groups[key]) groups[key] = [];
    groups[key].push('entries/' + id + '/' + filename);
  });
});

Object.keys(groups).forEach(function(key) {
  var outFile = path.join(manifestsDir, key + '.json');
  fs.writeFileSync(outFile, JSON.stringify(groups[key], null, 2) + '\n');
  console.log(key + ': ' + groups[key].length + ' entries');
});

console.log('Manifests written to content/dictionary/manifests/');

// puzzle — manifest is hand-maintained (name/grids need human input)
// warn about any puzzle dirs with full.jpg not registered in the manifest
const puzzleManifestPath = path.join(__dirname, '..', 'content/puzzle/manifest.json');
const puzzleFilesDir = path.join(__dirname, '..', 'assets/puzzle');
const puzzleManifest = fs.existsSync(puzzleManifestPath)
  ? JSON.parse(fs.readFileSync(puzzleManifestPath, 'utf8'))
  : [];
const registeredIds = new Set(puzzleManifest.map(e => e.id));
const orphans = fs.existsSync(puzzleFilesDir)
  ? fs.readdirSync(puzzleFilesDir).filter(d =>
      fs.statSync(path.join(puzzleFilesDir, d)).isDirectory() &&
      fs.existsSync(path.join(puzzleFilesDir, d, 'full.jpg')) &&
      !registeredIds.has(d)
    )
  : [];
if (orphans.length) {
  console.warn('⚠️  Puzzle dirs with full.jpg not in manifest — add to content/puzzle/manifest.json:');
  orphans.forEach(id => console.warn('   ' + id));
} else {
  console.log('content/puzzle/manifest.json: all puzzle dirs registered');
}

var lessonsDir = path.join(__dirname, '..', 'content/lessons');
var lessonIndex = fs.readdirSync(lessonsDir)
  .filter(function(f) { return f.endsWith('.json') && f !== 'index.json'; })
  .sort()
  .map(function(file) {
    try {
      var data = JSON.parse(fs.readFileSync(path.join(lessonsDir, file), 'utf8'));
      return data.label ? { file: file, activity: data.label } : null;
    } catch(e) { return null; }
  })
  .filter(Boolean);

fs.writeFileSync(path.join(lessonsDir, 'index.json'), JSON.stringify(lessonIndex, null, 2) + '\n');
console.log('content/lessons/index.json: ' + lessonIndex.length + ' entries');
