var MP_TILE = 100;
var MP_PAD = 12;
var MP_K = 0.34;
var MP_SIZE_MAP = { small: 1, medium: 1.6, large: 2.3 };

function mpStripDot(shapeSvg) {
  return shapeSvg.replace(/<circle[^>]*fill="#fff"[^>]*\/>/g, '');
}

function mpObjectSvg(obj, renderShape) {
  var scale = (MP_SIZE_MAP[obj.size] * MP_K).toFixed(3);
  var rot = obj.rot ? ' rotate(' + obj.rot + ')' : '';
  var x = (obj.x * MP_TILE).toFixed(1);
  var y = (obj.y * MP_TILE).toFixed(1);
  return '<g transform="translate(' + x + ',' + y + ') scale(' + scale + ')' + rot + '">' +
    mpStripDot(renderShape(obj.shape, obj.colour)) + '</g>';
}

function mpComposePicture(picture, renderShape) {
  var vb = -MP_PAD + ' ' + -MP_PAD + ' ' + (MP_TILE + MP_PAD * 2) + ' ' + (MP_TILE + MP_PAD * 2);
  return '<svg viewBox="' + vb + '">' +
    picture.objects.map(function(o) { return mpObjectSvg(o, renderShape); }).join('') + '</svg>';
}

function mpTilesHtml(makePictures, renderShape) {
  return makePictures.map(function(p, i) {
    return '<button class="lc-pic" data-testid="lc-pic" data-idx="' + i + '">' +
      '<span class="lc-pic-svg">' + mpComposePicture(p, renderShape) + '</span>' +
      '<span class="lc-pic-t">' + p.title + '</span></button>';
  }).join('');
}

if (typeof module !== 'undefined') module.exports = {
  MP_TILE, MP_K, MP_SIZE_MAP,
  mpStripDot, mpObjectSvg, mpComposePicture, mpTilesHtml
};
