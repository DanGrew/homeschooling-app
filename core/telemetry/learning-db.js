var DB_NAME = 'learning-records';
var DB_VERSION = 1;
var STORE = 'events';
var _db = null;

var NO_DB = {
  'true':  function(cb) { cb(_db); },
  'false': function(cb) {
    try {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function(e) { _db = e.target.result; cb(_db); };
      req.onerror = function() { cb(null); };
    } catch(e) { cb(null); }
  }
};

function _open(cb) {
  NO_DB[String(!!_db)](cb);
}

var SAVE_DB = {
  'true':  function() {},
  'false': function(db, event) {
    try {
      var tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).add(event);
    } catch(e) {}
  }
};

var GET_DB = {
  'true':  function(cb)      { cb([]); },
  'false': function(cb, db)  {
    try {
      var tx = db.transaction(STORE, 'readonly');
      var req = tx.objectStore(STORE).getAll();
      req.onsuccess = function(e) { cb(e.target.result || []); };
      req.onerror   = function()  { cb([]); };
    } catch(e) { cb([]); }
  }
};

export function saveEvent(event) {
  try {
    _open(function(db) { SAVE_DB[String(!db)](db, event); });
  } catch(e) {}
}

export function getAllEvents(cb) {
  try {
    _open(function(db) { GET_DB[String(!db)](cb, db); });
  } catch(e) { cb([]); }
}
