const ROUTINES = [
  { id: 'weekday-bau', label: 'Weekday' },
  { id: 'bank-holiday-weekend', label: 'Bank Holiday Weekend' }
];

const AXIS_W = 52;
const DAY_HEADER_H = 36;

let R = null;
let slotMins = 30;
let jumpHour = 8;
let gridStartMins = 0;
let gridEndMins = 24 * 60;
let focusedIndex = 0;
let orderedDays = [];
let nowTimer = null;

function computeGridRange() {
  gridStartMins = 0;
  gridEndMins = 24 * 60;
}

function _ppm() { return pixelsPerMin(slotMins); }

function addTopBand(body, firstStart, ppm) {
  ({ 'true': function () {
    const band = document.createElement('div');
    band.className = 'inactive-band';
    band.style.cssText = 'top:0;height:' + (firstStart * ppm) + 'px;';
    body.appendChild(band);
  }, 'false': function () {} })[String(firstStart > 0)]();
}

function addBottomBand(body, lastEnd, ppm) {
  ({ 'true': function () {
    const band = document.createElement('div');
    band.className = 'inactive-band';
    band.style.cssText = 'top:' + (lastEnd * ppm) + 'px;height:' + ((24 * 60 - lastEnd) * ppm) + 'px;';
    body.appendChild(band);
  }, 'false': function () {} })[String(lastEnd < 24 * 60)]();
}

function renderInactiveBands(body, schedule, ppm) {
  const firstStart = Math.min(...schedule.map(i => toMins(i.start)));
  const lastEnd = Math.max(...schedule.map(i => toMins(i.end)));
  addTopBand(body, firstStart, ppm);
  addBottomBand(body, lastEnd, ppm);
}

function renderScheduleBlock(body, act, item, ppm) {
  const startM = toMins(item.start);
  const endM = toMins(item.end);
  const { top, height } = blockLayout(startM, endM, gridStartMins, ppm);
  const block = document.createElement('div');
  block.className = 'block';
  ({ 'true': function () { block.classList.add('has-plan'); }, 'false': function () {} })[String(!!act.planId)]();
  block.style.cssText = `top:${top}px;height:${height}px;background:${act.color};`;
  block.innerHTML = `<span class="emoji">${act.emoji}</span><span class="lbl">${act.label}</span>`;
  block.addEventListener('click', () => openModal(act, item));
  body.appendChild(block);
}

function buildDayHeader(day, todayKey) {
  const hdr = document.createElement('div');
  hdr.className = 'day-header';
  const isToday = [false, day.key === todayKey][+!!R.meta.rollingWindow];
  ({ 'true': function () { hdr.innerHTML = '<span class="today-dot">\u25cf</span>' + day.label; },
     'false': function () { hdr.textContent = day.label; } })[String(isToday)]();
  return hdr;
}

function buildDayBody(day, ppm, bodyH, todayKey) {
  const body = document.createElement('div');
  body.className = 'day-body';
  body.style.height = bodyH + 'px';
  body.style.position = 'relative';
  renderSlotLines(body, ppm);
  const schedule = [day.schedule, []][+!day.schedule];
  ({ 'true': function () { renderInactiveBands(body, schedule, ppm); }, 'false': function () {} })[String(!!schedule.length)]();
  schedule.forEach(item => {
    const act = R.activities[item.activity];
    [act].filter(Boolean).forEach(a => renderScheduleBlock(body, a, item, ppm));
  });
  const isToday = [false, day.key === todayKey][+!!R.meta.rollingWindow];
  ({ 'true': function () { renderNowLine(body, ppm); }, 'false': function () {} })[String(isToday)]();
  return body;
}

function buildDayCol(day, idx, ppm, bodyH, todayKey) {
  const col = document.createElement('div');
  col.className = 'day-col';
  ({ 'true': function () { col.classList.add('is-focused'); }, 'false': function () {} })[String(idx === focusedIndex)]();
  const shouldDim = [false, idx !== focusedIndex][+!!R.meta.rollingWindow];
  ({ 'true': function () { col.classList.add('is-dim'); }, 'false': function () {} })[String(shouldDim)]();
  col.appendChild(buildDayHeader(day, todayKey));
  col.appendChild(buildDayBody(day, ppm, bodyH, todayKey));
  return col;
}

function renderDayColumn(day, idx, colsWrap, ppm, bodyH, todayKey) {
  colsWrap.appendChild(buildDayCol(day, idx, ppm, bodyH, todayKey));
}

function doRender() {
  const ppm = _ppm();
  const totalGridMins = gridEndMins - gridStartMins;
  const bodyH = totalGridMins * ppm;
  const todayKey = getTodayKey();

  renderTimeAxis(ppm, bodyH);

  const colsWrap = document.getElementById('cols-wrap');
  colsWrap.innerHTML = '';

  orderedDays.forEach((day, idx) => renderDayColumn(day, idx, colsWrap, ppm, bodyH, todayKey));

  updateFocusedLabel();
  updateNowNext();
  scrollToFocused();
  applySticky();
}

const DO_RENDER = {
  'true': doRender,
  'false': function () {},
};

function render() {
  DO_RENDER[String(!!R)]();
}

function timeAxisMins() {
  const count = Math.floor((gridEndMins - gridStartMins) / slotMins) + 1;
  return Array.from({ length: count }, (_, i) => gridStartMins + i * slotMins);
}

function renderTimeAxis(ppm, bodyH) {
  const axis = document.getElementById('time-axis');
  axis.style.height = (bodyH + DAY_HEADER_H) + 'px';
  axis.innerHTML = '';
  const spacer = document.createElement('div');
  spacer.style.cssText = `height:${DAY_HEADER_H}px;background:#fff8f0;`;
  axis.appendChild(spacer);
  timeAxisMins().forEach(m => {
    const top = (m - gridStartMins) * ppm;
    const lbl = document.createElement('div');
    lbl.className = 'time-label';
    lbl.style.top = (DAY_HEADER_H + top) + 'px';
    lbl.textContent = formatTimeLabel(m);
    axis.appendChild(lbl);
  });
}

function slotLineMins() {
  const totalGridMins = gridEndMins - gridStartMins;
  const count = Math.floor(totalGridMins / 15) + 1;
  return Array.from({ length: count }, (_, i) => i * 15);
}

function renderSlotLines(body, ppm) {
  slotLineMins().forEach(m => {
    const absMin = gridStartMins + m;
    const cls = slotLineClass(absMin, slotMins);
    const line = document.createElement('div');
    line.className = 'slot-line' + [' ' + cls, ''][+!cls];
    line.style.top = (m * ppm) + 'px';
    body.appendChild(line);
  });
}

function nowInRange(nowMins) {
  return [false, nowMins <= gridEndMins][+(nowMins >= gridStartMins)];
}

function renderNowLine(body, ppm) {
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  ({ 'true': function () {
    const line = document.createElement('div');
    line.className = 'now-line';
    line.id = 'now-line';
    line.style.top = ((nowMins - gridStartMins) * ppm) + 'px';
    body.appendChild(line);
  }, 'false': function () {} })[String(nowInRange(nowMins))]();
}

function findToday() {
  const todayKey = getTodayKey();
  return [null, R.days.find(d => d.key === todayKey)][+!!R.meta.rollingWindow];
}

function fmtActivity(item) {
  const act = R.activities[item.activity];
  return [() => item.activity, () => `${act.emoji} ${act.label} (${item.start})`][+!!act]();
}

function findCurrentNext(schedule, nowMins) {
  const result = { current: null, next: null };
  schedule.forEach(item => {
    const s = toMins(item.start), e = toMins(item.end);
    const isCurrent = [false, nowMins < e][+(nowMins >= s)];
    const isNext = [false, !result.next][+(nowMins < s)];
    result.current = [result.current, item][+!!isCurrent];
    result.next = [result.next, item][+!!isNext];
  });
  return result;
}

function setNoToday() {
  document.getElementById('now-label').textContent = '\u2014';
  document.getElementById('next-label').textContent = '\u2014';
}

function setNowNext(today) {
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const schedule = [today.schedule, []][+!today.schedule];
  const { current, next } = findCurrentNext(schedule, nowMins);
  document.getElementById('now-label').textContent = [() => '\u2014', () => fmtActivity(current)][+!!current]();
  document.getElementById('next-label').textContent = [() => '\u2014', () => fmtActivity(next)][+!!next]();
}

const UPDATE_NOW_NEXT = {
  'true': setNowNext,
  'false': setNoToday,
};

function updateNowNext() {
  const today = findToday();
  UPDATE_NOW_NEXT[String(!!today)](today);
}

function dayLabel(day) {
  return [() => '', () => day.label][+!!day]();
}

function setSnapDisplay(snapBtn) {
  const todayIdx = orderedDays.findIndex(d => d.key === getTodayKey());
  const show = [false, focusedIndex !== todayIdx][+(todayIdx !== -1)];
  snapBtn.style.display = ['none', ''][+!!show];
}

function hideSnap(snapBtn) {
  snapBtn.style.display = 'none';
}

const SET_SNAP = {
  'true': setSnapDisplay,
  'false': hideSnap,
};

function updateFocusedLabel() {
  const day = orderedDays[focusedIndex];
  document.getElementById('focused-label').textContent = dayLabel(day);
  const snapBtn = document.getElementById('snap-today');
  const hasRolling = [() => false, () => !!R.meta.rollingWindow][+!!R]();
  SET_SNAP[String(hasRolling)](snapBtn);
}

function toggleDimClass(c, i) {
  const hasRolling = [() => false, () => !!R.meta.rollingWindow][+!!R]();
  c.classList.toggle('is-dim', [false, i !== focusedIndex][+!!hasRolling]);
}

function doScrollFocused(cols) {
  const gridOuter = document.getElementById('grid-outer');
  const col = cols[focusedIndex];
  gridOuter.scrollLeft = focusedScrollX(col.offsetLeft, col.offsetWidth, gridOuter.clientWidth);
}

const DO_SCROLL_FOCUSED = {
  'true': doScrollFocused,
  'false': function () {},
};

function scrollToFocused() {
  const colsWrap = document.getElementById('cols-wrap');
  const cols = colsWrap.querySelectorAll('.day-col');
  cols.forEach((c, i) => {
    c.classList.toggle('is-focused', i === focusedIndex);
    toggleDimClass(c, i);
  });
  DO_SCROLL_FOCUSED[String(!!cols[focusedIndex])](cols);
}

function scrollToJumpTime() {
  const gridOuter = document.getElementById('grid-outer');
  gridOuter.scrollTop = jumpHour * 60 * _ppm();
}

function doScrollToNow() {
  const gridOuter = document.getElementById('grid-outer');
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const SCROLL_TO = {
    'true': function () { scrollToJumpTime(); },
    'false': function () { gridOuter.scrollTop = nowScrollTop(nowMins, gridStartMins, _ppm(), gridOuter.clientHeight, DAY_HEADER_H); },
  };
  SCROLL_TO[String(!nowInRange(nowMins))]();
}

function scrollToNow() {
  const active = [() => false, () => !!R.meta.rollingWindow][+!!R]();
  ({ 'true': doScrollToNow, 'false': function () {} })[String(active)]();
}

function applySticky() {
  const gridOuter = document.getElementById('grid-outer');
  const x = gridOuter.scrollLeft, y = gridOuter.scrollTop;
  document.getElementById('time-axis').style.transform = `translateX(${x}px)`;
  document.querySelectorAll('.day-header').forEach(h => h.style.transform = `translateY(${y}px)`);
}

function showPlanBtn(planBtn, act) {
  planBtn.style.display = '';
  planBtn.onclick = () => { window.location.href = `../plans/?p=${act.planId}`; };
}
function hidePlanBtn(planBtn) {
  planBtn.style.display = 'none';
}
const SET_PLAN_BTN = {
  'true': showPlanBtn,
  'false': hidePlanBtn,
};

function openModal(act, item) {
  document.getElementById('modal-title').textContent = `${act.emoji} ${act.label}`;
  document.getElementById('modal-time').textContent = `${item.start} \u2013 ${item.end}`;
  document.getElementById('modal-notes').textContent = [act.notes, ''][+!act.notes];
  const planBtn = document.getElementById('modal-plan');
  SET_PLAN_BTN[String(!!act.planId)](planBtn, act);
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
  Array.from({ length: 24 }, (_, h) => h).forEach(h => {
    sel.add(new Option(String(h).padStart(2,'0') + ':00', h));
  });
  sel.value = jumpHour;
}

function populateRoutinePicker() {
  const sel = document.getElementById('routine-picker');
  sel.innerHTML = '';
  ROUTINES.forEach(r => sel.add(new Option(r.label, r.id)));
}

function snapToToday() {
  const idx = orderedDays.findIndex(d => d.key === getTodayKey());
  ({ 'true': function () { focusedIndex = idx; updateFocusedLabel(); scrollToFocused(); scrollToNow(); },
     'false': function () {} })[String(idx !== -1)]();
}

function loadRoutine(id) {
  fetch(`../../content/routine/${id}.json`)
    .then(r => r.json())
    .then(data => {
      R = data;
      jumpHour = [R.meta.defaultStartHour, 8][+!R.meta.defaultStartHour];
      document.getElementById('jump-hour').value = jumpHour;
      computeGridRange();
      ({ days: orderedDays, focusedIndex } = buildOrderedDays(R, getTodayKey()));
      render();
      setTimeout(() => ({ 'true': scrollToNow, 'false': scrollToJumpTime })[String(!!R.meta.rollingWindow)](), 50);
      clearInterval(nowTimer);
      nowTimer = setInterval(() => {
        updateNowNext();
        const line = document.getElementById('now-line');
        [line].filter(Boolean).forEach(l => {
          const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
          l.style.top = ((nowMins - gridStartMins) * _ppm()) + 'px';
        });
      }, 60000);
    });
}

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
  ({ 'true': function () { focusedIndex--; updateFocusedLabel(); scrollToFocused(); },
     'false': function () {} })[String(focusedIndex > 0)]();
});
document.getElementById('next-day').addEventListener('click', () => {
  ({ 'true': function () { focusedIndex++; updateFocusedLabel(); scrollToFocused(); },
     'false': function () {} })[String(focusedIndex < orderedDays.length - 1)]();
});
document.getElementById('snap-today').addEventListener('click', () => {
  const active = [() => false, () => !!R.meta.rollingWindow][+!!R]();
  ({ 'true': snapToToday, 'false': function () {} })[String(active)]();
});
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  ({ 'true': closeModal, 'false': function () {} })[String(e.target === e.currentTarget)]();
});
window.addEventListener('resize', render);

populateRoutinePicker();
populateSlotSelect();
populateJumpSelect();
const defaultId = new URLSearchParams(window.location.search).get('r');
document.getElementById('routine-picker').value = [defaultId, ROUTINES[0].id][+!defaultId];
loadRoutine([defaultId, ROUTINES[0].id][+!defaultId]);
}
