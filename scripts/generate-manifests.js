const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, '..', 'app/dictionary');
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

console.log('Manifests written to app/dictionary/manifests/');

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
