'use strict';

function check(doc, html, optOuts = {}) {
  if (optOuts['activity-id']) return [];
  if (!html.includes('adult-prompts-ui.js')) return [];
  if (!html.includes('ACTIVITY_ID')) return ['ACTIVITY_ID not set'];
  return [];
}

module.exports = { check };
