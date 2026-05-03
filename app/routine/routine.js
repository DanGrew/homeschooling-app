const ROUTINES = [
  { id: 'weekday-bau', label: 'Weekday' },
  { id: 'bank-holiday-weekend', label: 'Bank Holiday Weekend' }
];

const AXIS_W = 52;
const DAY_HEADER_H = 36;
const SLOT_PX = { 15: 28, 30: 44, 60: 64 };

let R = null;
let slotMins = 30;
let jumpHour = 8;
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
  gridStartMins = 0;
  gridEndMins = 24 * 60;
}

function buildOrderedDays(routineData, todayKey) {
  if (!routineData) return { days: [], focusedIndex: 0 };
  if (routineData.meta.rollingWindow) {
    const allKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const todayIdx = allKeys.indexOf(todayKey);
    const r = routineData.meta.windowRadius || 3;
    const keys = [];
    for (let i = -r; i <= r; i++) keys.push(allKeys[(todayIdx + i + 7) % 7]);
    const days = keys.map(k => routineData.days.find(d => d.key === k)).filter(Boolean);
    let fi = days.findIndex(d => d.key === todayKey);
    if (fi === -1) fi = r;
    return { days, focusedIndex: fi };
  } else {
    return { days: routineData.days.slice(), focusedIndex: 0 };
  }
}

function pixelsPerMin() {
  return SLOT_PX[slotMins] / slotMins;
}

function render() {
  if (!R) return;
  const ppm = pixelsPerMin();
  const totalGridMins = gridEndMins - gridStartMins;
  const bodyH = totalGridMins * ppm;
  const todayKey = getTodayKey();

  renderTimeAxis(ppm, bodyH);

  const colsWrap = document.getElementById('cols-wrap');
  colsWrap.innerHTML = '';

  orderedDays.forEach((day, idx) => {
    const col = document.createElement('div');
    col.className = 'day-col';
    if (idx === focusedIndex) col.classList.add('is-focused');
    if (R.meta.rollingWindow && idx !== focusedIndex) col.classList.add('is-dim');

    const hdr = document.createElement('div');
    hdr.className = 'day-header';
    if (R.meta.rollingWindow && day.key === todayKey) {
      hdr.innerHTML = `<span class="today-dot">●</span>${day.label}`;
    } else {
      hdr.textContent = day.label;
    }
    col.appendChild(hdr);

    const body = document.createElement('div');
    body.className = 'day-body';
    body.style.height = bodyH + 'px';
    body.style.position = 'relative';

    renderSlotLines(body, ppm);

    const schedule = day.schedule || [];
    if (schedule.length) {
      const firstStart = Math.min(...schedule.map(i => toMins(i.start)));
      const lastEnd = Math.max(...schedule.map(i => toMins(i.end)));
      if (firstStart > 0) {
        const band = document.createElement('div');
        band.className = 'inactive-band';
        band.style.cssText = `top:0;height:${firstStart * ppm}px;`;
        body.appendChild(band);
      }
      if (lastEnd < 24 * 60) {
        const band = document.createElement('div');
        band.className = 'inactive-band';
        band.style.cssText = `top:${lastEnd * ppm}px;height:${(24 * 60 - lastEnd) * ppm}px;`;
        body.appendChild(band);
      }
    }

    schedule.forEach(item => {
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
  applySticky();
}

function renderTimeAxis(ppm, bodyH) {
  const axis = document.getElementById('time-axis');
  axis.style.height = (bodyH + DAY_HEADER_H) + 'px';
  axis.innerHTML = '';
  const spacer = document.createElement('div');
  spacer.style.cssText = `height:${DAY_HEADER_H}px;background:#fff8f0;`;
  axis.appendChild(spacer);
  for (let m = gridStartMins; m <= gridEndMins; m += slotMins) {
    const top = (m - gridStartMins) * ppm;
    const lbl = document.createElement('div');
    lbl.className = 'time-label';
    lbl.style.top = (DAY_HEADER_H + top) + 'px';
    const h = Math.floor(m / 60), min = m % 60;
    lbl.textContent = String(h).padStart(2,'0') + ':' + String(min).padStart(2,'0');
    axis.appendChild(lbl);
  }
}

function renderSlotLines(body, ppm) {
  const totalGridMins = gridEndMins - gridStartMins;
  for (let m = 0; m <= totalGridMins; m += 15) {
    const absMin = gridStartMins + m;
    const isHour = absMin % 60 === 0;
    const isSlot = absMin % slotMins === 0;
    const line = document.createElement('div');
    line.className = 'slot-line' + (isHour ? ' hour' : isSlot ? ' slot' : '');
    line.style.top = (m * ppm) + 'px';
    body.appendChild(line);
  }
}

function renderNowLine(body, ppm) {
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
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
  cols.forEach((c, i) => {
    c.classList.toggle('is-focused', i === focusedIndex);
    if (R && R.meta.rollingWindow) c.classList.toggle('is-dim', i !== focusedIndex);
  });
  if (!cols[focusedIndex]) return;
  const gridOuter = document.getElementById('grid-outer');
  const col = cols[focusedIndex];
  const scrollX = col.offsetLeft - (gridOuter.clientWidth / 2 - col.offsetWidth / 2);
  gridOuter.scrollLeft = Math.max(0, scrollX);
}

function scrollToJumpTime() {
  const gridOuter = document.getElementById('grid-outer');
  gridOuter.scrollTop = jumpHour * 60 * pixelsPerMin();
}

function scrollToNow() {
  if (!R || !R.meta.rollingWindow) return;
  const gridOuter = document.getElementById('grid-outer');
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  if (nowMins < gridStartMins || nowMins > gridEndMins) { scrollToJumpTime(); return; }
  const nowTop = DAY_HEADER_H + (nowMins - gridStartMins) * pixelsPerMin();
  gridOuter.scrollTop = Math.max(0, nowTop - gridOuter.clientHeight / 2);
}

function applySticky() {
  const gridOuter = document.getElementById('grid-outer');
  const x = gridOuter.scrollLeft, y = gridOuter.scrollTop;
  document.getElementById('time-axis').style.transform = `translateX(${x}px)`;
  document.querySelectorAll('.day-header').forEach(h => h.style.transform = `translateY(${y}px)`);
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

function populateSlotSelect() {
  const sel = document.getElementById('slot-size');
  sel.innerHTML = '';
  [{v:15,l:'15 min'},{v:30,l:'30 min'},{v:60,l:'1 hour'}].forEach(({v,l}) => sel.add(new Option(l, v)));
  sel.value = slotMins;
}

function populateJumpSelect() {
  const sel = document.getElementById('jump-hour');
  sel.innerHTML = '';
  for (let h = 0; h <= 23; h++) sel.add(new Option(String(h).padStart(2,'0') + ':00', h));
  sel.value = jumpHour;
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
      jumpHour = R.meta.defaultStartHour || 8;
      document.getElementById('jump-hour').value = jumpHour;
      computeGridRange();
      ({ days: orderedDays, focusedIndex } = buildOrderedDays(R, getTodayKey()));
      render();
      setTimeout(() => R.meta.rollingWindow ? scrollToNow() : scrollToJumpTime(), 50);
      clearInterval(nowTimer);
      nowTimer = setInterval(() => {
        updateNowNext();
        const line = document.getElementById('now-line');
        if (line) {
          const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
          line.style.top = ((nowMins - gridStartMins) * pixelsPerMin()) + 'px';
        }
      }, 60000);
    });
}

if (typeof module !== 'undefined') module.exports = { toMins, getTodayKey, buildOrderedDays };

if (typeof document !== 'undefined') {
document.getElementById('grid-outer').addEventListener('scroll', applySticky, {passive: true});

document.getElementById('routine-picker').addEventListener('change', e => {
  const url = new URL(window.location);
  url.searchParams.set('r', e.target.value);
  window.history.replaceState({}, '', url);
  loadRoutine(e.target.value);
});

document.getElementById('slot-size').addEventListener('change', e => {
  slotMins = parseInt(e.target.value);
  render();
  scrollToJumpTime();
});

document.getElementById('jump-hour').addEventListener('change', e => {
  jumpHour = parseInt(e.target.value);
  scrollToJumpTime();
});

document.getElementById('reset-view').addEventListener('click', () => {
  scrollToJumpTime();
  scrollToFocused();
});

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
populateSlotSelect();
populateJumpSelect();
const defaultId = new URLSearchParams(window.location.search).get('r') || ROUTINES[0].id;
document.getElementById('routine-picker').value = defaultId;
loadRoutine(defaultId);
}
