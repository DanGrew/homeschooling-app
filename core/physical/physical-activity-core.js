import { renderApparatusSVG } from './jungle-gym-svg.js';

const LEVEL_COLORS = {
  ground: { bg: '#E8F8F5', border: '#27AE60' },
  first:  { bg: '#FFFDE7', border: '#F39C12' },
  top:    { bg: '#EBF5FB', border: '#2980B9' },
};

function nodeLevel(nodeId, graphData) {
  const node = graphData.nodes.find(n => n.id === nodeId);
  return node ? node.level : 'ground';
}

export function renderRouteSteps(route, routeLabels, graphData) {
  return route.map((id, i) => {
    const label = routeLabels[i] || id;
    const { bg, border } = LEVEL_COLORS[nodeLevel(id, graphData)] || LEVEL_COLORS.ground;
    const isLast = i === route.length - 1;
    return `<span style="display:inline-flex;align-items:center;gap:6px;">` +
      `<span style="background:${bg};border:2px solid ${border};border-radius:8px;padding:4px 10px;font-size:0.9em;font-weight:bold;white-space:nowrap;">${label}</span>` +
      (isLast ? '' : `<span style="color:#aaa;font-size:1.2em;">›</span>`) +
      `</span>`;
  }).join('');
}

export function renderFlowRows(activityFlow) {
  return activityFlow.map(({ step, instruction, prompt }) =>
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #eee;">` +
    `<div style="display:flex;gap:12px;align-items:flex-start;padding:12px 12px 12px 0;border-right:2px solid #E8F8F5;">` +
    `<span style="min-width:28px;height:28px;border-radius:50%;background:#27AE60;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.95em;flex-shrink:0;">${step}</span>` +
    `<p style="margin:0;line-height:1.5;font-size:0.95em;padding-top:4px;">${instruction}</p>` +
    `</div>` +
    `<div style="padding:12px 0 12px 12px;color:#555;font-style:italic;font-size:0.9em;line-height:1.5;">${prompt || ''}</div>` +
    `</div>`
  ).join('');
}

export function renderGuidanceItems(adultGuidance) {
  return adultGuidance.map(({ headline, detail }) =>
    `<div style="padding:12px 0;border-bottom:1px solid #d5e8d4;">` +
    `<div style="font-weight:bold;color:#1E8449;margin-bottom:4px;">${headline}</div>` +
    `<div style="color:#444;font-size:0.9em;line-height:1.5;">${detail}</div>` +
    `</div>`
  ).join('');
}

export function renderFreePlay(freePlay) {
  const seeds = Array.isArray(freePlay) ? freePlay : [freePlay];
  return seeds.map(s => `<li style="padding:5px 0;">&#10023; ${s}</li>`).join('');
}

export function renderActivityHTML(activity, graphData) {
  const competencyBadges = activity.competencies
    .map(c => `<span style="display:inline-block;background:#D5F5E3;color:#1E8449;border-radius:12px;padding:4px 12px;font-size:0.85em;font-weight:bold;margin:3px;">${c.replace(/_/g, ' ')}</span>`)
    .join('');

  const routeHTML = renderRouteSteps(activity.route, activity.route_labels, graphData);
  const svgHTML = renderApparatusSVG(graphData, activity.route);
  const setupItems = activity.setup.map(s => `<li style="padding:5px 0;border-bottom:1px solid #eee;">${s}</li>`).join('');
  const flowRows = renderFlowRows(activity.activity_flow);
  const guidanceHTML = renderGuidanceItems(activity.adult_guidance);
  const variationItems = activity.variations
    .map((v, i) => `<li style="padding:7px 0;border-bottom:1px solid #eee;line-height:1.5;"><strong>${i + 1}.</strong> ${v}</li>`)
    .join('');
  const freePlayHTML = renderFreePlay(activity.free_play);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${activity.title}</title>
<link rel="stylesheet" href="../../../../styles/theme.css">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#F0FFF4;font-family:inherit;min-height:100vh;padding-bottom:48px;}
.header{background:#27AE60;color:#fff;padding:16px 20px;display:flex;align-items:center;gap:12px;}
.header a{color:#fff;text-decoration:none;font-size:1.5em;}
.header h1{font-size:1.3em;line-height:1.3;}
.archetype{font-size:0.8em;opacity:0.85;margin-top:2px;}
.card{background:#fff;border-radius:12px;margin:16px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
.card h2{font-size:1em;color:#1E8449;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;}
.flow-header{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:4px;}
.flow-header span{font-size:0.75em;color:#aaa;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:6px;border-bottom:2px solid #eee;}
.flow-header span:last-child{padding-left:12px;}
.route{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
ul{list-style:none;padding:0;}
.movements{display:flex;flex-wrap:wrap;gap:8px;}
.movement-tag{background:#FEF9E7;border:1px solid #F39C12;color:#7D6608;border-radius:8px;padding:4px 10px;font-size:0.85em;}
.why{color:#555;line-height:1.7;font-size:0.95em;}
</style>
</head>
<body>

<div class="header">
  <a href="../../index.html">&#8592;</a>
  <div>
    <h1>${activity.title}</h1>
    <div class="archetype">${activity.archetype}</div>
  </div>
</div>

<div class="card">
  <h2>Competencies</h2>
  <div>${competencyBadges}</div>
</div>

<div class="card">
  <h2>Key Movements</h2>
  <div class="movements">
    ${activity.key_movements.map(m => `<span class="movement-tag">${m}</span>`).join('')}
  </div>
</div>

<div class="card">
  <h2>Route</h2>
  <div class="route">${routeHTML}</div>
  <div style="margin-top:16px;position:relative;">
    ${svgHTML}
    <button onclick="document.getElementById('apparatus-dialog').showModal()" style="position:absolute;top:6px;right:6px;background:rgba(255,255,255,0.9);border:1px solid #ddd;border-radius:6px;padding:4px 8px;font-size:0.75em;cursor:pointer;color:#555;">&#x26F6; Expand</button>
  </div>
</div>

<dialog id="apparatus-dialog" style="padding:0;border:none;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.25);max-width:90vw;width:560px;background:#fff;" onclick="this.close()">
  <div onclick="event.stopPropagation()" style="padding:20px;position:relative;">
    <button onclick="document.getElementById('apparatus-dialog').close()" style="position:absolute;top:12px;right:12px;background:#f0f0f0;border:none;border-radius:50%;width:28px;height:28px;font-size:1em;cursor:pointer;line-height:1;">&#x2715;</button>
    <h3 style="font-size:0.9em;color:#1E8449;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Apparatus Route</h3>
    ${svgHTML}
  </div>
</dialog>

<div class="card">
  <h2>Setup</h2>
  <ul>${setupItems}</ul>
</div>

<div class="card">
  <h2>Activity</h2>
  <div class="flow-header"><span>Steps</span><span>Prompts</span></div>
  ${flowRows}
</div>

<div class="card" style="background:#F0FFF4;border:1px solid #A9DFBF;">
  <h2>Adult Guidance</h2>
  ${guidanceHTML}
</div>

<div class="card">
  <h2>Variations</h2>
  <ul>${variationItems}</ul>
</div>

<div class="card">
  <h2>Free Play</h2>
  <ul style="color:#1E8449;line-height:1.8;">${freePlayHTML}</ul>
</div>

<div class="card">
  <h2>Why This Works</h2>
  <p class="why">${activity.why_it_works}</p>
</div>

</body>
</html>`;
}

export function renderIndexHTML(activities) {
  const competencyColors = ['#D5F5E3', '#D6EAF8', '#FEF9E7', '#FDEDEC'];

  const tiles = activities.map(({ name, activity }) => {
    const badges = activity.competencies.slice(0, 2)
      .map((c, i) => `<span style="font-size:0.7em;background:${competencyColors[i % 4]};border-radius:8px;padding:2px 8px;margin:2px;display:inline-block;">${c.replace(/_/g, ' ')}</span>`)
      .join('');
    return `  <a class="tile" href="activities/${name}/" style="background:#F0FFF4;">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 8px 4px;gap:6px;">
      <svg viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:48px;height:40px;">
        <rect x="10" y="30" width="40" height="4" rx="2" fill="#A9DFBF"/>
        <rect x="20" y="18" width="4" height="14" rx="2" fill="#27AE60"/>
        <rect x="36" y="18" width="4" height="14" rx="2" fill="#27AE60"/>
        <rect x="22" y="10" width="16" height="10" rx="3" fill="#52BE80"/>
        <circle cx="30" cy="6" r="4" fill="#82E0AA"/>
      </svg>
      <div style="text-align:center;">${badges}</div>
    </div>
    <span style="padding:0 8px 12px;text-align:center;font-size:0.95em;">${activity.title}</span>
  </a>`;
  }).join('\n');

  const emptyMsg = activities.length === 0
    ? '<p class="empty">No activities yet — ask Claude to generate some.</p>'
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>Physical Play</title>
<link rel="stylesheet" href="../../styles/theme.css">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#F0FFF4;display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:32px 16px 48px;}
h1{font-size:3em;color:#1E8449;margin-bottom:8px;}
.subtitle{color:#555;margin-bottom:40px;font-size:1em;}
.tiles{display:flex;flex-wrap:wrap;justify-content:center;gap:20px;}
.tile{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;width:180px;height:180px;border-radius:24px;text-decoration:none;color:#333;font-family:inherit;font-weight:bold;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.12);transition:transform 0.15s,box-shadow 0.15s;background:#fff;padding:0;}
.tile:hover{transform:translateY(-4px);box-shadow:0 8px 18px rgba(0,0,0,0.18);}
.home{color:#27AE60;margin-bottom:24px;align-self:flex-start;}
.empty{color:#aaa;font-style:italic;margin-top:32px;}
</style>
</head>
<body>
<a class="home" href="../index.html">&#127968; Home</a>
<h1>Physical Play</h1>
<p class="subtitle">Jungle gym activities — adult guided</p>
<div class="tiles">
${tiles}${emptyMsg}
</div>
</body>
</html>`;
}
