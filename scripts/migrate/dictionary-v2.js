const fs = require('fs');
const path = require('path');

const dictDir = path.join(__dirname, 'app/dictionary');
const entriesDir = path.join(dictDir, 'entries');

const animals = JSON.parse(fs.readFileSync(path.join(entriesDir, 'manifest.json'), 'utf8'));

const repTypeMeta = {
  'colouring.json':      { type: 'colouring',   level: 1 },
  'connect-dots.json':   { type: 'connectDots',  level: 1 },
  'drawing-dots-1.json': { type: 'drawingDots',  level: 1 },
  'drawing-dots-2.json': { type: 'drawingDots',  level: 2 },
};

animals.forEach(function(id) {
  var animalDir = path.join(entriesDir, id);
  var indexFile = path.join(animalDir, 'index.json');
  var entry = JSON.parse(fs.readFileSync(indexFile, 'utf8'));

  // Write concept.json
  var concept = {
    id: entry.id,
    name: entry.meta.name,
    phonetic: entry.meta.phonetic,
    tags: entry.meta.tags
  };
  fs.writeFileSync(path.join(animalDir, 'concept.json'), JSON.stringify(concept, null, 2) + '\n');

  // Write image.json
  var image = {
    concept: id,
    type: 'image',
    level: 1,
    viewBox: entry.viewBox,
    src: 'entries/' + id + '/' + id + '.svg'
  };
  fs.writeFileSync(path.join(animalDir, 'image.json'), JSON.stringify(image, null, 2) + '\n');

  // Update each rep file
  Object.keys(repTypeMeta).forEach(function(filename) {
    var repFile = path.join(animalDir, filename);
    if (!fs.existsSync(repFile)) return;
    var rep = JSON.parse(fs.readFileSync(repFile, 'utf8'));
    var meta = repTypeMeta[filename];
    var updated = Object.assign({ concept: id, type: meta.type, level: meta.level, viewBox: entry.viewBox }, rep);
    fs.writeFileSync(repFile, JSON.stringify(updated, null, 2) + '\n');
  });

  // Delete index.json
  fs.unlinkSync(indexFile);
  console.log(id + ': migrated');
});

// Rename manifest.json -> dictionary.json
fs.renameSync(
  path.join(entriesDir, 'manifest.json'),
  path.join(dictDir, 'dictionary.json')
);

console.log('manifest.json -> dictionary.json');
console.log('Done. Run generate-manifests.js next.');
