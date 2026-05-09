const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\danie\\Documents\\dan-grew-repos\\homeschooling\\scripts\\vecteezy_cute-emoticons-faces-feeling-vector-set-for-social-media_6664262_split';
const entriesDir = path.join(__dirname, '..', 'app/dictionary/entries');

const attribution = {
  text: 'Emoticons Vectors by Vecteezy',
  url: 'https://www.vecteezy.com/free-vector/emoticons'
};

function toTitleCase(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractViewBox(svgContent) {
  const match = svgContent.match(/viewBox="([^"]+)"/);
  return match ? match[1] : '0 0 202 203';
}

const svgFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));

svgFiles.forEach(function(filename) {
  const id = filename.replace('.svg', '');
  const name = toTitleCase(id);
  const entryDir = path.join(entriesDir, id);

  if (!fs.existsSync(entryDir)) fs.mkdirSync(entryDir, { recursive: true });

  const svgContent = fs.readFileSync(path.join(srcDir, filename), 'utf8');
  const viewBox = extractViewBox(svgContent);

  fs.copyFileSync(path.join(srcDir, filename), path.join(entryDir, filename));

  fs.writeFileSync(path.join(entryDir, 'concept.json'), JSON.stringify({
    id,
    name,
    phonetic: id,
    tags: ['emotions']
  }, null, 2) + '\n');

  fs.writeFileSync(path.join(entryDir, 'image.json'), JSON.stringify({
    concept: id,
    type: 'image',
    level: 1,
    viewBox,
    src: `entries/${id}/${filename}`,
    attribution
  }, null, 2) + '\n');

  console.log(`✓ ${id}`);
});

console.log(`\nImported ${svgFiles.length} emoticons.`);
