'use strict';

function attr(el, name) { return el.getAttribute(name); }
function hasAttr(el, name) { return el.hasAttribute(name); }

function checkOptOut(el, feature, errors) {
  const optOut = attr(el, `data-no-${feature}`);
  if (optOut !== null && optOut.trim() === '') {
    errors.push(`data-no-${feature} requires a non-empty reason string`);
    return false;
  }
  return optOut !== null;
}

function check(doc) {
  const errors = [];
  const bars = doc.querySelectorAll('.nav-bar');

  if (bars.length === 0) { errors.push('Missing .nav-bar element'); return errors; }
  if (bars.length > 1)   { errors.push(`Multiple .nav-bar elements found (${bars.length})`); return errors; }

  const bar = bars[0];

  if (!hasAttr(bar, 'data-home') || attr(bar, 'data-home').trim() === '') {
    errors.push('data-home is required on .nav-bar (no opt-out)');
  }

  const hasTitle = hasAttr(bar, 'data-title') && attr(bar, 'data-title').trim() !== '';
  const noTitle  = checkOptOut(bar, 'title', errors);
  if (!hasTitle && !noTitle) {
    errors.push('data-title or data-no-title="<reason>" required on .nav-bar');
  }

  if (hasTitle) {
    const hasInstruction = hasAttr(bar, 'data-instruction') && attr(bar, 'data-instruction').trim() !== '';
    const noInstruction  = checkOptOut(bar, 'instruction', errors);
    if (!hasInstruction && !noInstruction) {
      errors.push('data-instruction or data-no-instruction="<reason>" required when data-title is set');
    }
  }

  const hasLinks = hasAttr(bar, 'data-links');
  const noLinks  = checkOptOut(bar, 'links', errors);
  if (!hasLinks && !noLinks) {
    errors.push('data-links or data-no-links="<reason>" required on .nav-bar');
  }

  return errors;
}

module.exports = { check };
