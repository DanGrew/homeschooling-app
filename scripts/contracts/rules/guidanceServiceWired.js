'use strict';

const fs = require('fs');
const path = require('path');

function extractLearningsBase(html) {
  const m = html.match(/LEARNINGS_BASE\s*=\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

function check(doc, html, abs, optOuts = {}) {
  if (optOuts['guidance-service']) return [];
  if (!html.includes('guidance-service.js')) return [];
  const errors = [];
  const base = extractLearningsBase(html);
  if (!base) {
    errors.push('imports guidance-service.js but window.LEARNINGS_BASE not set');
  } else {
    const resolved = path.resolve(path.dirname(abs), base);
    if (!fs.existsSync(resolved)) {
      errors.push('LEARNINGS_BASE resolves to non-existent path: ' + resolved);
    }
  }
  if (!html.includes('new GuidanceService()')) {
    errors.push('imports guidance-service.js but new GuidanceService() not called');
  }
  return errors;
}

module.exports = { check };
