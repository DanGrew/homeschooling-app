var DB_NAME = 'learning-records';
var DB_VERSION = 1;
var STORE = 'events';
var _db = null;

function _open(cb) {
  if (_db) { cb(_db); return; }
  try {
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = function(e) { _db = e.target.result; cb(_db); };
    req.onerror = function() {};
  } catch(e) {}
}

export function saveEvent(event) {
  try {
    _open(function(db) {
      try {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).add(event);
      } catch(e) {}
    });
  } catch(e) {}
}

export function getAllEvents(cb) {
  try {
    _open(function(db) {
      try {
        var tx = db.transaction(STORE, 'readonly');
        var req = tx.objectStore(STORE).getAll();
        req.onsuccess = function(e) { cb(e.target.result || []); };
        req.onerror = function() { cb([]); };
      } catch(e) { cb([]); }
    });
  } catch(e) { cb([]); }
}
