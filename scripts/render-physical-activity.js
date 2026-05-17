#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ACTIVITIES_JSON = path.join(ROOT, 'content/physical/activities');
const ACTIVITIES_HTML = path.join(ROOT, 'app/physical/activities');

const args = process.argv.slice(2);
const target = args[0];

(async () => {
  const { renderActivityHTML, renderIndexHTML } = await import('../core/physical/physical-activity-core.js');

  const graphData = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'content/physical/jungle-gym.json'), 'utf8'
  ));

  const files = target
    ? [`${target}.json`]
    : fs.readdirSync(ACTIVITIES_JSON).filter(f => f.endsWith('.json'));

  if (!files.length) {
    console.log('No activity JSON files found.');
    process.exit(0);
  }

  const activities = [];

  files.forEach(file => {
    const name = file.replace('.json', '');
    const activity = JSON.parse(fs.readFileSync(path.join(ACTIVITIES_JSON, file), 'utf8'));
    const html = renderActivityHTML(activity, graphData);
    const outDir = path.join(ACTIVITIES_HTML, name);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    console.log(`Rendered: app/physical/activities/${name}/index.html`);
    activities.push({ name, activity });
  });

  if (!target) {
    const allFiles = fs.readdirSync(ACTIVITIES_JSON).filter(f => f.endsWith('.json'));
    const allActivities = allFiles.map(file => ({
      name: file.replace('.json', ''),
      activity: JSON.parse(fs.readFileSync(path.join(ACTIVITIES_JSON, file), 'utf8'))
    }));
    const indexHTML = renderIndexHTML(allActivities);
    fs.writeFileSync(path.join(ROOT, 'app/physical/index.html'), indexHTML);
    console.log('Updated: app/physical/index.html');
  }
})();
