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
    if (!rep.type) return;
    var key = rep.type;
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

// puzzle — manifest is hand-maintained (name/grids/image need human input)
const puzzleManifestPath = path.join(__dirname, '..', 'content/puzzle/manifest.json');
const puzzleManifest = fs.existsSync(puzzleManifestPath)
  ? JSON.parse(fs.readFileSync(puzzleManifestPath, 'utf8'))
  : [];
const puzzleMissingImage = puzzleManifest.filter(function(e) {
  if (!e.image) return true;
  var imgPath = path.join(__dirname, '..', e.image.replace(/^(\.\.\/)+/, ''));
  return !fs.existsSync(imgPath);
});
if (puzzleMissingImage.length) {
  console.warn('⚠️  Puzzle entries with missing image — check content/puzzle/manifest.json:');
  puzzleMissingImage.forEach(function(e) { console.warn('   ' + e.id + ': ' + (e.image || '(no image field)')); });
} else {
  console.log('content/puzzle/manifest.json: all images present');
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

var learningsDir = path.join(__dirname, '..', 'content/learnings');
var learningsManifest = fs.readdirSync(learningsDir)
  .filter(function(f) { return f.endsWith('.json') && f !== 'manifest.json'; })
  .sort()
  .map(function(f) {
    try {
      var data = JSON.parse(fs.readFileSync(path.join(learningsDir, f), 'utf8'));
      var type = data.type || (f.includes('exercise') ? 'exercise' : 'lesson');
      var entry = { id: data.id, source: data.source, title: data.title, type: type };
      if (data.number != null) entry.number = data.number;
      if (Array.isArray(data.criteria)) entry.criteria = data.criteria;
      return entry;
    } catch(e) { return null; }
  })
  .filter(Boolean);

fs.writeFileSync(
  path.join(learningsDir, 'manifest.json'),
  JSON.stringify(learningsManifest, null, 2) + '\n'
);
console.log('content/learnings/manifest.json: ' + learningsManifest.length + ' entries');

// paint backgrounds — scan configured folder, emit manifest with page-relative paths
var paintBgConfigPath = path.join(__dirname, '..', 'content/paint-playground/backgrounds.config.json');
var paintBgConfig = fs.existsSync(paintBgConfigPath) ? JSON.parse(fs.readFileSync(paintBgConfigPath, 'utf8')) : {};
var paintBgSourceRel = paintBgConfig.source || 'assets/paint-playground/backgrounds';
var paintBgDir = path.join(__dirname, '..', paintBgSourceRel);
var paintBgManifestPath = path.join(__dirname, '..', 'content/paint-playground/backgrounds.json');
var paintBgEntries = [];
if (fs.existsSync(paintBgDir)) {
  var paintBgFilename = paintBgConfig.filename;
  var paintBgLabelsRel = paintBgConfig.labels;
  var paintBgLabelMap = {};
  if (paintBgLabelsRel) {
    var labelsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', paintBgLabelsRel), 'utf8'));
    labelsData.forEach(function(e) { paintBgLabelMap[e.id] = e.name; });
  }
  if (paintBgFilename) {
    // subdirectory mode: each subdir contains a known filename
    paintBgEntries = fs.readdirSync(paintBgDir)
      .filter(function(d) { return fs.statSync(path.join(paintBgDir, d)).isDirectory(); })
      .filter(function(d) { return fs.existsSync(path.join(paintBgDir, d, paintBgFilename)); })
      .sort()
      .map(function(d) {
        var label = paintBgLabelMap[d] || (d[0].toUpperCase() + d.slice(1).replace(/-/g, ' '));
        return { path: '../../../' + paintBgSourceRel + '/' + d + '/' + paintBgFilename, label: label };
      });
  } else {
    // flat folder mode: direct PNG/JPG files
    paintBgEntries = fs.readdirSync(paintBgDir)
      .filter(function(f) { return /\.(png|jpe?g)$/i.test(f); })
      .sort()
      .map(function(f) {
        var label = f.replace(/\.[^.]+$/, '').split('-').map(function(w) { return w[0].toUpperCase() + w.slice(1); }).join(' ');
        return { path: '../../../' + paintBgSourceRel + '/' + f, label: label };
      });
  }
}
if (!fs.existsSync(path.dirname(paintBgManifestPath))) {
  fs.mkdirSync(path.dirname(paintBgManifestPath), { recursive: true });
}
fs.writeFileSync(paintBgManifestPath, JSON.stringify(paintBgEntries, null, 2) + '\n');
console.log('content/paint-playground/backgrounds.json: ' + paintBgEntries.length + ' entries');

// shared images — manifest is hand-maintained; warn about orphaned files
var sharedImagesManifestPath = path.join(__dirname, '..', 'content/shared/images/manifest.json');
var sharedImagesDir = path.join(__dirname, '..', 'assets/shared/images');
var sharedImagesManifest = fs.existsSync(sharedImagesManifestPath)
  ? JSON.parse(fs.readFileSync(sharedImagesManifestPath, 'utf8'))
  : [];
var registeredSharedIds = new Set(sharedImagesManifest.map(function(e) { return e.id; }));
var sharedOrphans = fs.existsSync(sharedImagesDir)
  ? fs.readdirSync(sharedImagesDir).filter(function(f) {
      var id = f.replace(/\.[^.]+$/, '');
      return /\.(png|jpe?g)$/i.test(f) && !registeredSharedIds.has(id);
    })
  : [];
if (sharedOrphans.length) {
  console.warn('⚠️  Shared images not in manifest — add to content/shared/images/manifest.json:');
  sharedOrphans.forEach(function(f) { console.warn('   ' + f); });
} else {
  console.log('content/shared/images/manifest.json: ' + sharedImagesManifest.length + ' entries');
}
