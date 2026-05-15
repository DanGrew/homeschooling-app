'use strict';

function attr(el, name) { return el.getAttribute(name); }
function hasAttr(el, name) { return el.hasAttribute(name); }

function check(doc, optOuts = {}) {
  const errors = [];
  const bars = doc.querySelectorAll('.nav-bar');

  if (bars.length === 0) { errors.push('Missing .nav-bar element'); return errors; }
  if (bars.length > 1)   { errors.push(`Multiple .nav-bar elements found (${bars.length})`); return errors; }

  const bar = bars[0];

  if (!hasAttr(bar, 'data-home') || attr(bar, 'data-home').trim() === '') {
    errors.push('data-home is required on .nav-bar (no opt-out)');
  }

  const hasTitle = hasAttr(bar, 'data-title') && attr(bar, 'data-title').trim() !== '';
  if (!hasTitle && !optOuts.title) {
    errors.push('data-title required on .nav-bar (or declare opt-out in contract.json)');
  }

  if (hasTitle || optOuts.title) {
    const hasInstruction = hasAttr(bar, 'data-instruction') && attr(bar, 'data-instruction').trim() !== '';
    const noInstruction = hasAttr(bar, 'data-no-instruction') && attr(bar, 'data-no-instruction').trim() !== '';
    if (!hasInstruction && !noInstruction && !optOuts.instruction) {
      errors.push('data-instruction required when title is set (or add data-no-instruction="<reason>" or declare opt-out in contract.json)');
    }
  }

  const hasLinks = hasAttr(bar, 'data-links');
  const noLinks = hasAttr(bar, 'data-no-links') && attr(bar, 'data-no-links').trim() !== '';
  if (!hasLinks && !noLinks && !optOuts.links) {
    errors.push('data-links required on .nav-bar (or add data-no-links="<reason>" or declare opt-out in contract.json)');
  }

  if (!doc.querySelector('.game-area')) {
    errors.push('Missing .game-area sibling — content must be wrapped in <div class="game-area">');
  }

  return errors;
}

module.exports = { check };
