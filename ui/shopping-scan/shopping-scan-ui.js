import { buildFilterBar } from '../filter-bar/filter-bar-ui.js';
import { flattenCatalogs, escHtml, byName, setAllItems, getListItems, resetListItems, filterListItems, renderTiles, renderList, hidePhase1, showPhase1, showSuccess, startFindPhase } from '../shopping/shopping-ui.js';

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
  [null].filter(function() { return scanFound + scanCrossed === scanTotal; }).forEach(function() { stopScan(); setTimeout(showSuccess, 600); });
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
    [null].filter(function() { return scanFound + scanCrossed === scanTotal; }).forEach(function() { stopScan(); setTimeout(showSuccess, 600); });
  }
};

function onNotHere(row, btn) {
  [null].filter(function() { return !row.classList.contains('found'); })
        .forEach(function() { CROSS_ACTION[String(row.classList.contains('crossed'))](row, btn); });
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
    var btn = row.querySelector('.btn-not-here');
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
    [null].filter(function() { return e.key === 'Enter'; }).forEach(function() { document.getElementById('stub-btn').click(); });
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
  document.getElementById('success-banner').style.display = 'none';
  document.getElementById('phase2').style.display = 'none';
  document.getElementById('phase-scan').style.display = 'none';
  document.getElementById('scan-stub').style.display = 'none';
  resetListItems();
  showPhase1();
  renderList();
  renderTiles();
}

function buildCatalogItems(filtered, catalogs) {
  return filtered.flatMap(function(c) {
    return catalogs.filter(function(cat) { return cat.name === c.name; })
                   .flatMap(function(cat) {
                     return cat.items.map(function(it) {
                       return { name: it.name, barcode: it.barcode, icon: it.icon, tags: [].concat(cat.tags).filter(Boolean), catalog: cat.name };
                     });
                   });
  });
}

export function init(catalogs) {
  [null].filter(function() { return !hasDetector; }).forEach(function() {
    document.getElementById('scan-unavailable').textContent = 'No camera — stub mode active';
  });

  document.getElementById('btn-find').addEventListener('click', startFindPhase);
  document.getElementById('btn-scan-it').addEventListener('click', startScanPhase);
  document.getElementById('btn-again').addEventListener('click', resetScan);

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
