const fs = require('fs');
const path = require('path');

const generatedDir = path.join(__dirname, 'app/games/colouring/generated');
const entriesDir = path.join(__dirname, 'app/dictionary/entries');

['elephant', 'cat'].forEach(function(animal) {
  [1, 2].forEach(function(level) {
    var shapes = [];
    var code = fs.readFileSync(path.join(generatedDir, animal + '-drawing-dots-level-' + level + '.js'), 'utf8');
    eval(code);

    var shape = shapes[0];
    var rep = {
      dots: shape.dots,
      edges: shape.edges,
      decor: shape.decor || ''
    };

    var repKey = 'drawingDots' + level;
    var repFile = path.join(entriesDir, animal, 'drawing-dots-' + level + '.json');
    fs.writeFileSync(repFile, JSON.stringify(rep, null, 2) + '\n');

    var indexFile = path.join(entriesDir, animal, 'index.json');
    var entry = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    entry.representations[repKey] = 'entries/' + animal + '/drawing-dots-' + level + '.json';
    fs.writeFileSync(indexFile, JSON.stringify(entry, null, 2) + '\n');

    console.log(animal + ' level ' + level + ': drawing-dots migrated, ' + shape.dots.length + ' dots, ' + shape.edges.length + ' edges');
  });
});
