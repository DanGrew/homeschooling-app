const fs = require('fs');
const path = require('path');

const entriesDir = path.join(__dirname, '..', 'content/dictionary/entries');

const vehicles = [
  'bus', 'cement-mixer', 'digger', 'race-car', 'tractor', 'train', 'truck'
];

vehicles.forEach(function(vehicle) {
  var jsFile = path.join(entriesDir, vehicle + '-colouring-level-1.js');
  var outFile = path.join(entriesDir, vehicle, 'colouring.json');

  var pictures = [];
  var code = fs.readFileSync(jsFile, 'utf8');
  eval(code);

  var pic = pictures[0];
  var shapes = pic.shapes.map(function(s, i) {
    var shape = { id: 'shape_' + (i + 1), tag: s.tag, attrs: s.attrs };
    if (s.colour !== undefined) shape.colour = s.colour;
    if (s.noColour) shape.noColour = true;
    if (s.fixed) shape.fixed = true;
    return shape;
  });

  var entry = {
    concept: vehicle,
    type: 'colouring',
    level: 1,
    viewBox: pic.vb,
    shapes: shapes
  };

  fs.writeFileSync(outFile, JSON.stringify(entry, null, 2) + '\n');
  console.log(vehicle + ': ' + shapes.length + ' shapes');
});
