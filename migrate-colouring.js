const fs = require('fs');
const path = require('path');

const generatedDir = path.join(__dirname, 'app/games/colouring/generated');
const entriesDir = path.join(__dirname, 'app/dictionary/entries');

const animals = [
  'bird','bull','camel','cat','cow','dog','duck','elephant',
  'fish','giraffe','goose','horse','lion','monkey','mouse',
  'rabbit','tiger','turtle','zebra'
];

animals.forEach(function(animal) {
  var jsFile = path.join(generatedDir, animal + '-colouring-level-1.js');
  var jsonFile = path.join(entriesDir, animal + '.json');

  var pictures = [];
  var code = fs.readFileSync(jsFile, 'utf8');
  eval(code);

  var shapes = pictures[0].shapes.map(function(s, i) {
    var shape = { id: 'shape_' + (i + 1), tag: s.tag, attrs: s.attrs };
    if (s.colour !== undefined) shape.colour = s.colour;
    if (s.noColour) shape.noColour = true;
    if (s.fixed) shape.fixed = true;
    return shape;
  });

  var entry = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  entry.colouring = { shapes: shapes };
  fs.writeFileSync(jsonFile, JSON.stringify(entry, null, 2) + '\n');

  console.log(animal + ': ' + shapes.length + ' shapes');
});
