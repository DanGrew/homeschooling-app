'use strict';

function check(doc, html, optOuts = {}) {
  if (optOuts.speakable) return [];
  const errors = [];

  const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
  const hasCss = links.some(l => (l.getAttribute('href') || '').includes('speakable.css'));
  if (!hasCss) errors.push('speakable.css not linked');

  const hasJs = html.includes('speech-ui.js');
  if (!hasJs) errors.push('speech-ui.js not imported');

  const hasSpeakable = html.includes('speakable.js');
  if (!hasSpeakable) errors.push('speakable.js not imported');

  return errors;
}

module.exports = { check };
