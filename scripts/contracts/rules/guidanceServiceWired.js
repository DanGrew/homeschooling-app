'use strict';

function check(doc, html, optOuts = {}) {
  if (optOuts['guidance-service']) return [];
  if (!html.includes('guidance-service.js')) return [];
  const errors = [];
  if (!html.includes('LEARNINGS_BASE')) {
    errors.push('imports guidance-service.js but window.LEARNINGS_BASE not set');
  }
  if (!html.includes('new GuidanceService()')) {
    errors.push('imports guidance-service.js but new GuidanceService() not called');
  }
  return errors;
}

module.exports = { check };
