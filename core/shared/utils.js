function once(fn) {
  var called = false, result;
  return function() {
    if (!called) {
      called = true;
      try { result = fn(); } catch(e) { result = Promise.reject(e); }
    }
    return result;
  };
}

if (typeof module !== 'undefined') module.exports = { once };
