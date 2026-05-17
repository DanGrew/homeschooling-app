'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..', '..');

function extractActivityId(html) {
  const m = html.match(/ACTIVITY_ID\s*=\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

function check(doc, html, optOuts = {}) {
  if (optOuts['guidance-service']) return [];
  if (!html.includes('guidance-service.js')) return [];
  const errors = [];
  const id = extractActivityId(html);
  if (!id) {
    errors.push('imports guidance-service.js but ACTIVITY_ID not set');
    return errors;
  }
  const lessonPath = path.join(ROOT, 'content', 'lessons', id + '.json');
  if (!fs.existsSync(lessonPath)) {
    errors.push('imports guidance-service.js but content/lessons/' + id + '.json not found');
  }
  return errors;
}

module.exports = { check };
