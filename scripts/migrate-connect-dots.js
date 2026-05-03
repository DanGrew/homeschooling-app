const fs = require('fs');
const path = require('path');

const generatedDir = path.join(__dirname, 'app/games/colouring/generated');
const entriesDir = path.join(__dirname, 'app/dictionary/entries');

// Only elephant has connect-the-dots generated data
var shapes = [];
var code = fs.readFileSync(path.join(generatedDir, 'elephant-connect-the-dots-level-1.js'), 'utf8');
eval(code);

var shape = shapes[0];
var rep = {
  dots: shape.dots,
  guides: shape.guides,
  outline: shape.outline || [],
  decor: shape.decor || ''
};

var repFile = path.join(entriesDir, 'elephant', 'connect-dots.json');
fs.writeFileSync(repFile, JSON.stringify(rep, null, 2) + '\n');

var indexFile = path.join(entriesDir, 'elephant', 'index.json');
var entry = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
entry.representations.connectDots = 'entries/elephant/connect-dots.json';
fs.writeFileSync(indexFile, JSON.stringify(entry, null, 2) + '\n');

console.log('elephant: connect-dots migrated, ' + shape.dots.length + ' dots');
