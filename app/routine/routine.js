const ROUTINES = [
  { id: 'weekday-bau', label: 'Weekday' },
  { id: 'bank-holiday-weekend', label: 'Bank Holiday Weekend' }
];

const AXIS_W = 52;
const DAY_HEADER_H = 36;

let R = null;
let focusStart = 7;
let focusEnd = 20;
let gridStartMins = 0;
let gridEndMins = 24 * 60;
let focusedIndex = 0;
let orderedDays = [];
let nowTimer = null;

function toMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getTodayKey() {
  return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
}

function computeGridRange() {
  let minM = Infinity, maxM = 0;
  for (const day of R.days) {
    for (const item of (day.schedule || [])) {
      minM = Math.min(minM, toMins(item.start));
      maxM = Math.max(maxM, toMins(item.end));
    }
  }
  gridStartMins = minM === Infinity ? 0 : Math.floor(minM / 60) * 60;
  gridEndMins = maxM === 0 ? 24 * 60 : Math.ceil(maxM / 60) * 60;
}

function buildOrderedDays() {
  if (!R) return;
  if (R.meta.rollingWindow) {
    const todayKey = getTodayKey();
    const allKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const todayIdx = allKeys.indexOf(todayKey);
    const r = R.meta.windowRadius || 3;
    const keys = [];
    for (let i = -r; i <= r; i++) keys.push(allKeys[(todayIdx + i + 7) % 7]);
    orderedDays = keys.map(k => R.days.find(d => d.key === k)).filter(Boolean);
    focusedIndex = orderedDays.findIndex(d => d.key === todayKey);
    if (focusedIndex === -1) focusedIndex = r;
  } else {
    orderedDays = R.days.slice();
    focusedIndex = 0;
  }
}

function pixelsPerMin() {
  const focusMins = (focusEnd - focusStart) * 60;
  const gridH = Math.max(window.innerHeight - 200, 400);
  return gridH / focusMins;
}

function render() {
  if (!R) return;
  const ppm = pixelsPerMin();
  const totalGridMins = gridEndMins - gridStartMins;
  const bodyH = totalGridMins * ppm;
  const focusBandTop = (focusStart * 60 - gridStartMins) * ppm;
  const focusBandH = (focusEnd - focusStart) * 60 * ppm;
  const todayKey = getTodayKey();

  renderTimeAxis(ppm, bodyH);

  const colsWrap = document.getElementById('cols-wrap');
  colsWrap.innerHTML = '';

  orderedDays.forEach((day, idx) => {
    const col = document.createElement('div');
    col.className = 'day-col';
    if (R.meta.rollingWindow && day.key === todayKey) col.classList.add('is-today');
    if (idx === focusedIndex) col.classList.add('is-focused');
    if (R.meta.rollingWindow && day.key !== todayKey && idx !== focusedIndex) col.classList.add('is-dim');

    const hdr = document.createElement('div');
    hdr.className = 'day-header';
    hdr.textContent = day.label;
    col.appendChild(hdr);

    const body = document.createElement('div');
    body.className = 'day-body';
    body.style.height = bodyH + 'px';
    body.style.position = 'relative';

    const band = document.createElement('div');
    band.className = 'focus-band';
    band.style.top = focusBandTop + 'px';
    band.style.height = focusBandH + 'px';
    body.appendChild(band);

    renderSlotLines(body, ppm);

    (day.schedule || []).forEach(item => {
      const act = R.activities[item.activity];
      if (!act) return;
      const startM = toMins(item.start);
      const endM = toMins(item.end);
      const top = (startM - gridStartMins) * ppm;
      const height = Math.max((endM - startM) * ppm, 20);

      const block = document.createElement('div');
      block.className = 'block';
      if (act.planId) block.classList.add('has-plan');
      block.style.cssText = `top:${top}px;height:${height}px;background:${act.color};`;
      block.innerHTML = `<span class="emoji">${act.emoji}</span><span class="lbl">${act.label}</span>`;
      block.addEventListener('click', () => openModal(act, item));
      body.appendChild(block);
    });

    if (R.meta.rollingWindow && day.key === todayKey) {
      renderNowLine(body, ppm);
    }

    col.appendChild(body);
    colsWrap.appendChild(col);
  });

  updateFocusedLabel();
  updateNowNext();
  scrollToFocused();
}

function renderTimeAxis(ppm, bodyH) {
  const axis = document.getElementById('time-axis');
  axis.style.height = (bodyH + DAY_HEADER_H) + 'px';
  axis.innerHTML = '';
  const spacer = document.createElement('div');
  spacer.style.height = DAY_HEADER_H + 'px';
  axis.appendChild(spacer);
  const startH = Math.floor(gridStartMins / 60);
  const endH = Math.ceil(gridEndMins / 60);
  for (let h = startH; h <= endH; h++) {
    const top = (h * 60 - gridStartMins) * ppm;
    const lbl = document.createElement('div');
    lbl.className = 'time-label';
    lbl.style.top = (DAY_HEADER_H + top) + 'px';
    lbl.textContent = String(h).padStart(2,'0') + ':00';
    axis.appendChild(lbl);
  }
}

function renderSlotLines(body, ppm) {
  const totalGridMins = gridEndMins - gridStartMins;
  for (let m = 0; m <= totalGridMins; m += 15) {
    const line = document.createElement('div');
    const absMin = gridStartMins + m;
    line.className = 'slot-line' + (absMin % 60 === 0 ? ' hour' : '');
    line.style.top = (m * ppm) + 'px';
    body.appendChild(line);
  }
}

function renderNowLine(body, ppm) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  if (nowMins < gridStartMins || nowMins > gridEndMins) return;
  const line = document.createElement('div');
  line.className = 'now-line';
  line.id = 'now-line';
  line.style.top = ((nowMins - gridStartMins) * ppm) + 'px';
  body.appendChild(line);
}

function updateNowNext() {
  const todayKey = getTodayKey();
  const today = R.meta.rollingWindow ? R.days.find(d => d.key === todayKey) : null;
  const nowLabel = document.getElementById('now-label');
  const nextLabel = document.getElementById('next-label');
  if (!today) { nowLabel.textContent = '—'; nextLabel.textContent = '—'; return; }

  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  let current = null, next = null;
  for (const item of (today.schedule || [])) {
    const s = toMins(item.start), e = toMins(item.end);
    if (nowMins >= s && nowMins < e) current = item;
    else if (nowMins < s && !next) next = item;
  }
  const fmt = item => {
    const act = R.activities[item.activity];
    return act ? `${act.emoji} ${act.label} (${item.start})` : item.activity;
  };
  nowLabel.textContent = current ? fmt(current) : '—';
  nextLabel.textContent = next ? fmt(next) : '—';
}

function updateFocusedLabel() {
  const day = orderedDays[focusedIndex];
  document.getElementById('focused-label').textContent = day ? day.label : '';
  const snapBtn = document.getElementById('snap-today');
  if (R && R.meta.rollingWindow) {
    const todayIdx = orderedDays.findIndex(d => d.key === getTodayKey());
    snapBtn.style.display = todayIdx !== -1 && focusedIndex !== todayIdx ? '' : 'none';
  } else {
    snapBtn.style.display = 'none';
  }
}

function scrollToFocused() {
  const colsWrap = document.getElementById('cols-wrap');
  const cols = colsWrap.querySelectorAll('.day-col');
  const todayKey = getTodayKey();
  cols.forEach((c, i) => {
    c.classList.toggle('is-focused', i === focusedIndex);
    if (R && R.meta.rollingWindow) {
      c.classList.toggle('is-dim', orderedDays[i]?.key !== todayKey && i !== focusedIndex);
    }
  });
  if (!cols[focusedIndex]) return;
  const gridOuter = document.getElementById('grid-outer');
  const col = cols[focusedIndex];
  const colW = col.offsetWidth;
  const scrollX = col.offsetLeft - (gridOuter.clientWidth / 2 - colW / 2);
  gridOuter.scrollLeft = Math.max(0, scrollX);
}

function scrollToFocusWindow() {
  const gridOuter = document.getElementById('grid-outer');
  const ppm = pixelsPerMin();
  const focusTop = (focusStart * 60 - gridStartMins) * ppm + DAY_HEADER_H;
  gridOuter.scrollTop = Math.max(0, focusTop);
}

function scrollToNow() {
  if (!R || !R.meta.rollingWindow) return;
  const gridOuter = document.getElementById('grid-outer');
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  if (nowMins < gridStartMins || nowMins > gridEndMins) { scrollToFocusWindow(); return; }
  const ppm = pixelsPerMin();
  const nowTop = (nowMins - gridStartMins) * ppm + DAY_HEADER_H;
  gridOuter.scrollTop = Math.max(0, nowTop - gridOuter.clientHeight / 2);
}

function openModal(act, item) {
  document.getElementById('modal-title').textContent = `${act.emoji} ${act.label}`;
  document.getElementById('modal-time').textContent = `${item.start} – ${item.end}`;
  document.getElementById('modal-notes').textContent = act.notes || '';
  const planBtn = document.getElementById('modal-plan');
  if (act.planId) {
    planBtn.style.display = '';
    planBtn.onclick = () => { window.location.href = `../plans/?p=${act.planId}`; };
  } else {
    planBtn.style.display = 'none';
  }
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

function populateHourSelects() {
  const startSel = document.getElementById('start-hour');
  const endSel = document.getElementById('end-hour');
  startSel.innerHTML = '';
  endSel.innerHTML = '';
  for (let h = 0; h <= 23; h++) {
    const lbl = String(h).padStart(2,'0') + ':00';
    startSel.add(new Option(lbl, h));
    endSel.add(new Option(lbl, h));
  }
  startSel.value = focusStart;
  endSel.value = focusEnd;
}

function populateRoutinePicker() {
  const sel = document.getElementById('routine-picker');
  sel.innerHTML = '';
  ROUTINES.forEach(r => sel.add(new Option(r.label, r.id)));
}

function loadRoutine(id) {
  fetch(`data/${id}.json`)
    .then(r => r.json())
    .then(data => {
      R = data;
      focusStart = R.meta.defaultStartHour;
      focusEnd = R.meta.defaultEndHour;
      document.getElementById('start-hour').value = focusStart;
      document.getElementById('end-hour').value = focusEnd;
      computeGridRange();
      buildOrderedDays();
      render();
      setTimeout(() => R.meta.rollingWindow ? scrollToNow() : scrollToFocusWindow(), 50);
      clearInterval(nowTimer);
      nowTimer = setInterval(() => {
        updateNowNext();
        const line = document.getElementById('now-line');
        if (line) {
          const ppm = pixelsPerMin();
          const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
          line.style.top = ((nowMins - gridStartMins) * ppm) + 'px';
        }
      }, 60000);
    });
}

document.getElementById('routine-picker').addEventListener('change', e => {
  const url = new URL(window.location);
  url.searchParams.set('r', e.target.value);
  window.history.replaceState({}, '', url);
  loadRoutine(e.target.value);
});

document.getElementById('start-hour').addEventListener('change', e => {
  focusStart = parseInt(e.target.value);
  if (focusStart >= focusEnd) { focusEnd = focusStart + 1; document.getElementById('end-hour').value = focusEnd; }
  render();
  scrollToFocusWindow();
});

document.getElementById('end-hour').addEventListener('change', e => {
  focusEnd = parseInt(e.target.value);
  if (focusEnd <= focusStart) { focusStart = focusEnd - 1; document.getElementById('start-hour').value = focusStart; }
  render();
  scrollToFocusWindow();
});

document.getElementById('reset-view').addEventListener('click', scrollToFocusWindow);
document.getElementById('prev-day').addEventListener('click', () => {
  if (focusedIndex > 0) { focusedIndex--; updateFocusedLabel(); scrollToFocused(); }
});
document.getElementById('next-day').addEventListener('click', () => {
  if (focusedIndex < orderedDays.length - 1) { focusedIndex++; updateFocusedLabel(); scrollToFocused(); }
});
document.getElementById('snap-today').addEventListener('click', () => {
  if (!R || !R.meta.rollingWindow) return;
  const idx = orderedDays.findIndex(d => d.key === getTodayKey());
  if (idx !== -1) { focusedIndex = idx; updateFocusedLabel(); scrollToFocused(); scrollToNow(); }
});
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
window.addEventListener('resize', render);

populateRoutinePicker();
populateHourSelects();
const defaultId = new URLSearchParams(window.location.search).get('r') || ROUTINES[0].id;
document.getElementById('routine-picker').value = defaultId;
loadRoutine(defaultId);
