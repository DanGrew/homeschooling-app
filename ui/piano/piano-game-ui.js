var gameState = 'idle';
var startTime = 0, pausedOffset = 0, pausedAt = 0;
var notes = [], hitCount = 0, rafId = null;
var NOTE_HEIGHT = 36;
var DONE = { hit: true, missed: true };

var CTRL_STATE = {
  'idle':    ['', '&#9654; Play', 'none', 'none'],
  'playing': ['none', '&#9654; Play', '', ''],
  'paused':  ['', '&#9654; Resume', 'none', '']
};

function updateControls() {
  var s = CTRL_STATE[gameState];
  document.getElementById('btn-play').style.display = s[0];
  document.getElementById('btn-play').innerHTML = s[1];
  document.getElementById('btn-pause').style.display = s[2];
  document.getElementById('btn-stop').style.display = s[3];
}

function createNoteEl(note, gameArea) {
  var el = document.createElement('div');
  el.id = 'note-' + note.id;
  el.dataset.keyIndex = note.keyIndex;
  el.dataset.noteId = note.id;
  var lw = 100 / PIANO_CONFIG.KEY_COUNT;
  el.style.cssText = 'position:absolute;pointer-events:none;width:' + (lw - 0.5) + '%;left:' + (note.keyIndex * lw) + '%;height:' + NOTE_HEIGHT + 'px;border-radius:8px;background:' + PIANO_CONFIG.KEY_COLORS[note.keyIndex] + ';border:2px solid rgba(0,0,0,0.2);box-sizing:border-box;';
  gameArea.appendChild(el);
}

function getOrMakeNoteEl(note, gameArea) {
  [null].filter(() => !document.getElementById('note-' + note.id)).forEach(() => createNoteEl(note, gameArea));
  return document.getElementById('note-' + note.id);
}

function expireNote(note) {
  note.state = 'missed';
  [document.getElementById('note-' + note.id)].filter(Boolean).forEach(el => el.remove());
}

function moveNote(note, elapsed, areaHeight, gameArea) {
  var progress = (elapsed - note.spawnTime) / PIANO_CONFIG.LOOKAHEAD_MS;
  [progress].filter(p => p >= 0).filter(p => p <= 1.15).forEach(p => {
    getOrMakeNoteEl(note, gameArea).style.top = (p * (areaHeight - NOTE_HEIGHT)) + 'px';
  });
}

function tickNote(note, elapsed, areaHeight, gameArea) {
  [note].filter(n => n.state === 'active').filter(n => elapsed > n.hitTime + PIANO_CONFIG.HIT_WINDOW_MS).forEach(n => expireNote(n));
  [note].filter(n => n.state === 'active').forEach(n => moveNote(n, elapsed, areaHeight, gameArea));
}

function endGame() {
  gameState = 'idle';
  [rafId].filter(Boolean).forEach(id => cancelAnimationFrame(id));
  updateControls();
  var msg = scoreMessage(hitCount);
  document.getElementById('score-emoji').textContent = msg.emoji;
  document.getElementById('score-text').textContent = msg.text;
  document.getElementById('score-sub').textContent = msg.sub;
  document.getElementById('score-overlay').style.display = 'flex';
}

function runFrame(elapsed, areaHeight, gameArea) {
  notes.forEach(n => tickNote(n, elapsed, areaHeight, gameArea));
  var active = notes.filter(n => !DONE[n.state]);
  [endGame].filter(() => !active.length).filter(() => notes.length).forEach(f => f());
  [null].filter(() => active.length).forEach(() => { rafId = requestAnimationFrame(gameLoop); });
}

function gameLoop() {
  var gameArea = document.getElementById('game-area');
  var elapsed = performance.now() - startTime - pausedOffset;
  [runFrame].filter(() => gameState === 'playing').forEach(f => f(elapsed, gameArea.clientHeight, gameArea));
}

var HIT_RESULT = {
  'true': (closest, keyEl) => {
    closest.state = 'hit';
    hitCount++;
    playNote(closest.note, 1.0);
    glowKey(keyEl, 'hit');
    [document.getElementById('note-' + closest.id)].filter(Boolean).forEach(el => el.remove());
    document.getElementById('score-display').textContent = hitCount + ' \u2B50';
  },
  'false': (closest, keyEl) => glowKey(keyEl, 'miss')
};

function processHit(closest, elapsed, keyEl) {
  HIT_RESULT[String(Math.abs(elapsed - closest.hitTime) <= PIANO_CONFIG.HIT_WINDOW_MS)](closest, keyEl);
}

function handleActive(activeInLane, elapsed, keyEl) {
  var closest = activeInLane.sort((a, b) => Math.abs(elapsed - a.hitTime) - Math.abs(elapsed - b.hitTime))[0];
  processHit(closest, elapsed, keyEl);
}

function handleKeyPress(i, elapsed, keyEl) {
  var activeInLane = notes.filter(n => n.state === 'active').filter(n => n.keyIndex === i);
  [() => glowKey(keyEl, 'miss')].filter(() => !activeInLane.length).forEach(f => f());
  [handleActive].filter(() => activeInLane.length).forEach(f => f(activeInLane, elapsed, keyEl));
}

function onKeyPress(i, note, keyEl) {
  var elapsed = performance.now() - startTime - pausedOffset;
  [handleKeyPress].filter(() => gameState === 'playing').forEach(f => f(i, elapsed, keyEl));
}

function startGame() {
  notes = generateNotes(PIANO_CONFIG);
  hitCount = 0;
  startTime = performance.now();
  pausedOffset = 0;
  gameState = 'playing';
  updateControls();
  document.getElementById('score-display').textContent = '';
  document.getElementById('score-overlay').style.display = 'none';
  rafId = requestAnimationFrame(gameLoop);
}

function doResume() {
  pausedOffset += performance.now() - pausedAt;
  gameState = 'playing';
  updateControls();
  rafId = requestAnimationFrame(gameLoop);
}

var PLAY_ACTION = {
  'idle':    () => initAudio().then(startGame).catch(() => {}),
  'playing': () => {},
  'paused':  doResume
};

function pressPlay() { PLAY_ACTION[gameState](); }

function doPause() {
  pausedAt = performance.now();
  gameState = 'paused';
  [rafId].filter(Boolean).forEach(id => cancelAnimationFrame(id));
  updateControls();
}

function pressPause() {
  [doPause].filter(() => gameState === 'playing').forEach(f => f());
}

function pressStop() {
  [rafId].filter(Boolean).forEach(id => cancelAnimationFrame(id));
  rafId = null;
  gameState = 'idle';
  notes.forEach(n => { [document.getElementById('note-' + n.id)].filter(Boolean).forEach(el => el.remove()); });
  notes = [];
  hitCount = 0;
  document.getElementById('score-display').textContent = '';
  document.getElementById('score-overlay').style.display = 'none';
  updateControls();
}

function playAgain() {
  pressStop();
  pressPlay();
}

export function init() {
  document.getElementById('btn-play').addEventListener('click', pressPlay);
  document.getElementById('btn-pause').addEventListener('click', pressPause);
  document.getElementById('btn-stop').addEventListener('click', pressStop);
  document.getElementById('btn-play-again').addEventListener('click', playAgain);
  renderKeys(document.getElementById('keys-wrap'), onKeyPress);
}
