import { indexPieces, partShape, pictureViewBox, pieceChecklist, pieceIcon, levelDots, pictureId } from '../../core/shape-pictures/shape-pictures-core.js';
import { firstIndexAfter, sortByName } from '../../core/collections/collections-core.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PAD = 0.25;
const MAX_LEVEL = 3;

var model = { pictures: [], pieces: [], byId: {}, colours: {} };

function svgEl(tag, attrs) {
  var el = document.createElementNS(SVG_NS, tag);
  Object.keys(attrs).forEach(function(k) { el.setAttribute(k, attrs[k]); });
  return el;
}

function pieceEl(piece, shape) {
  return svgEl(shape.tag, Object.assign({ fill: model.colours[piece.colour] }, shape.attrs));
}

function pictureSvg(picture) {
  var svg = svgEl('svg', { viewBox: pictureViewBox(picture, model.byId, PAD), preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': picture.name + ' picture', class: 'sp-pic' });
  var g = svgEl('g', { stroke: '#fff', 'stroke-width': '0.04', 'stroke-linejoin': 'round' });
  picture.parts.forEach(function(part) { g.appendChild(pieceEl(model.byId[part.piece], partShape(model.byId[part.piece], part))); });
  svg.appendChild(g);
  return svg;
}

function iconSvg(piece) {
  var icon = pieceIcon(piece);
  var svg = svgEl('svg', { viewBox: icon.viewBox, 'aria-hidden': 'true' });
  svg.appendChild(pieceEl(piece, icon.shape));
  return svg;
}

function pieceItem(item) {
  var li = document.createElement('li');
  li.dataset.piece = item.id;
  li.appendChild(iconSvg(model.byId[item.id]));
  li.appendChild(document.createTextNode(item.label));
  return li;
}

function cardEl(picture, idx) {
  var card = document.createElement('div');
  card.className = 'worksheet-item';
  card.dataset.idx = idx;
  card.dataset.picture = pictureId(picture);
  var head = document.createElement('div');
  head.className = 'sp-head';
  var name = document.createElement('h3');
  name.textContent = picture.name;
  var dots = document.createElement('span');
  dots.className = 'sp-dots';
  dots.textContent = levelDots(picture.level, MAX_LEVEL);
  head.appendChild(name);
  head.appendChild(dots);
  var frame = document.createElement('div');
  frame.className = 'sp-frame';
  frame.appendChild(pictureSvg(picture));
  var list = document.createElement('ul');
  list.className = 'sp-pieces';
  pieceChecklist(picture, model.pieces).forEach(function(item) { list.appendChild(pieceItem(item)); });
  card.appendChild(head);
  card.appendChild(frame);
  card.appendChild(list);
  return card;
}

function addCard(idx) {
  var sheet = document.getElementById('sheet');
  document.getElementById('empty-msg').style.display = 'none';
  var items = Array.from(sheet.querySelectorAll('.worksheet-item'));
  var after = items[firstIndexAfter(items.map(function(el) { return parseInt(el.dataset.idx, 10); }), idx)];
  sheet.insertBefore(cardEl(model.pictures[idx], idx), after);
}

var EMPTY_DISPLAY = { 'true': 'none', 'false': '' };

function removeCard(idx) {
  var sheet = document.getElementById('sheet');
  sheet.querySelectorAll('.worksheet-item[data-idx="' + idx + '"]').forEach(function(el) { el.remove(); });
  document.getElementById('empty-msg').style.display = EMPTY_DISPLAY[String(!!sheet.querySelector('.worksheet-item'))];
}

var TICK = { 'true': addCard, 'false': removeCard };

function panelItem(picture, idx) {
  var item = document.createElement('div');
  item.className = 'panel-item';
  var cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = 'cb-' + idx;
  cb.dataset.picture = pictureId(picture);
  var lbl = document.createElement('label');
  lbl.htmlFor = cb.id;
  lbl.textContent = picture.name;
  var dots = document.createElement('span');
  dots.className = 'sp-dots';
  dots.textContent = levelDots(picture.level, MAX_LEVEL);
  cb.addEventListener('change', function() { TICK[String(cb.checked)](idx); });
  item.appendChild(cb);
  item.appendChild(lbl);
  item.appendChild(dots);
  return item;
}

function buildPanel() {
  var list = document.getElementById('panel-list');
  list.innerHTML = '';
  model.pictures.forEach(function(pic, idx) { list.appendChild(panelItem(pic, idx)); });
}

function applyData(data) {
  model.pieces = data.pieces;
  model.byId = indexPieces(data.pieces);
  model.colours = data.colours;
  model.pictures = sortByName(data.pictures.slice());
  buildPanel();
}

function showLoadError() {
  document.getElementById('panel-list').textContent = '⚠️ Failed to load — check connection';
}

export function init(contentUrl) {
  var toggle = document.getElementById('shadow-toggle');
  toggle.addEventListener('change', function() { document.getElementById('sheet').classList.toggle('shadow', toggle.checked); });
  document.getElementById('btn-print').addEventListener('click', function() { window.print(); });
  return fetch(contentUrl).then(function(r) { return r.json(); }).then(applyData).catch(showLoadError);
}
