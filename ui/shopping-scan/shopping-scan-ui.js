import { buildFilterBar } from '../../components/filter-bar/filter-bar-ui.js';
import { flattenCatalogs, escHtml, byName, setAllItems, getListItems, resetListItems, filterListItems, renderTiles, renderList, hidePhase1, showPhase1, showSuccess, startFindPhase } from '../shopping/shopping-ui.js';
import { buildCatalogItems } from '../../core/shopping-scan/shopping-scan-core.js';
import { makeSpeakable } from '../../components/speech/speakable.js';

var AudioCtx = [window.AudioContext, window.webkitAudioContext].filter(Boolean)[0];
var hasDetector = typeof BarcodeDetector !== 'undefined';

var scanStream = null, scanInterval = null, scanFound = 0, scanCrossed = 0, scanTotal = 0;
var barcodeMap = {};

function beep() {
  [AudioCtx].filter(Boolean).forEach(function(Ctx) {
    var ctx = new Ctx();
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    o.start(); o.stop(ctx.currentTime + 0.25);
  });
}

var _toastTimer = null;
function showScanToast(icon, name) {
  var t = document.getElementById('scan-toast');
  document.getElementById('scan-toast-icon').textContent = icon;
  document.getElementById('scan-toast-name').textContent = name;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { t.classList.remove('show'); }, 1500);
}

function stopScan() {
  [scanInterval].filter(Boolean).forEach(function(id) { clearInterval(id); scanInterval = null; });
  [scanStream].filter(Boolean).forEach(function(s) { s.getTracks().forEach(function(t) { t.stop(); }); scanStream = null; });
  document.getElementById('scan-video').srcObject = null;
}

function doMatch(entry) {
  entry.row.classList.add('found');
  entry.row.querySelector('.sc-tick').textContent = '✅';
  beep();
  showScanToast(entry.icon, entry.name);
  scanFound++;
  ({'true':function(){stopScan();setTimeout(function(){showSuccess(resetScan);},600);},'false':function(){}})[String(scanFound+scanCrossed===scanTotal)]();
}

function matchBarcode(value) {
  [barcodeMap[value]]
    .filter(Boolean)
    .filter(function(e) { return !e.row.classList.contains('found'); })
    .forEach(doMatch);
}

var CROSS_ACTION = {
  'true': function(row, btn) {
    row.classList.remove('crossed');
    row.querySelector('.sc-tick').textContent = '☐';
    scanCrossed--;
    btn.textContent = 'Not here ✕';
  },
  'false': function(row, btn) {
    row.classList.add('crossed');
    row.querySelector('.sc-tick').textContent = '✕';
    scanCrossed++;
    btn.textContent = 'Undo';
    ({'true':function(){stopScan();setTimeout(function(){showSuccess(resetScan);},600);},'false':function(){}})[String(scanFound+scanCrossed===scanTotal)]();
  }
};

function onNotHere(row, btn) {
  ({'true':function(){CROSS_ACTION[String(row.classList.contains('crossed'))](row,btn);},'false':function(){}})[String(!row.classList.contains('found'))]();
}

function buildChecklist() {
  var ci = document.getElementById('scan-checklist-items');
  ci.innerHTML = '';
  barcodeMap = {};
  scanFound = 0; scanCrossed = 0;
  var currentList = getListItems();
  scanTotal = currentList.length;
  currentList.slice().sort(byName).forEach(function(it) {
    var row = document.createElement('div');
    row.className = 'sc-row';
    row.innerHTML = '<span class="sc-tick">☐</span><span class="sc-icon">' + it.icon + '</span><span class="sc-name">' + escHtml(it.name) + '</span><button class="btn-not-here">Not here ✕</button>';
    makeSpeakable(row.querySelector('.sc-name'), it.name);
    var btn = row.querySelector('.btn-not-here');
    makeSpeakable(btn, function() { return btn.textContent.replace('✕', '').trim(); });
    btn.addEventListener('click', function() { onNotHere(row, btn); });
    barcodeMap[it.barcode] = { row: row, name: it.name, icon: it.icon };
    ci.appendChild(row);
  });
}

function setupStubMode() {
  document.getElementById('scan-stub').style.display = 'flex';
  var input = document.getElementById('stub-input');
  input.value = '';
  document.getElementById('stub-btn').onclick = function() {
    matchBarcode(input.value.trim());
    input.value = '';
    input.focus();
  };
  input.onkeydown = function(e) {
    ({'true':function(){document.getElementById('stub-btn').click();},'false':function(){}})[String(e.key==='Enter')]();
  };
}

function setupCameraMode() {
  var detector = new BarcodeDetector();
  var v = document.getElementById('scan-video');
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function(s) {
    scanStream = s;
    v.srcObject = s;
    scanInterval = setInterval(function() {
      [v].filter(function(v) { return v.readyState >= 2; }).forEach(function(v) {
        detector.detect(v).then(function(codes) { codes.forEach(function(c) { matchBarcode(c.rawValue); }); }).catch(function() {});
      });
    }, 500);
  }).catch(function(e) {
    document.getElementById('scan-checklist-title').textContent = 'Camera error: ' + e.message;
  });
}

var SCAN_SETUP = { 'true': setupStubMode, 'false': setupCameraMode };

function startScanPhase() {
  hidePhase1();
  document.getElementById('phase-scan').style.display = 'flex';
  buildChecklist();
  SCAN_SETUP[String(!hasDetector)]();
}

function resetScan() {
  stopScan();
  document.getElementById('phase2').style.display = 'none';
  document.getElementById('phase-scan').style.display = 'none';
  document.getElementById('scan-stub').style.display = 'none';
  resetListItems();
  showPhase1();
  renderList();
  renderTiles();
}

export function init(catalogs) {
  ({'true':function(){var su=document.getElementById('scan-unavailable');su.textContent='No camera — stub mode active';makeSpeakable(su,'No camera — stub mode active');},'false':function(){}})[String(!hasDetector)]();

  document.getElementById('btn-find').addEventListener('click', function() { startFindPhase(resetScan); });
  document.getElementById('btn-scan-it').addEventListener('click', startScanPhase);

  setAllItems(flattenCatalogs(catalogs));
  buildFilterBar(
    catalogs.map(function(c) { return { tags: [].concat(c.tags).filter(Boolean), name: c.name }; }),
    function(filtered) {
      var items = buildCatalogItems(filtered, catalogs);
      setAllItems(items);
      filterListItems(function(li) { return items.some(function(i) { return i.barcode === li.barcode; }); });
      renderTiles();
      renderList();
    }
  );
}
