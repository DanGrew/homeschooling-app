var _AudioCtxClass = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);

function createAudioCtx() {
  return new _AudioCtxClass();
}

function decodeAudioBuffer(ctx, buf) {
  // Callback form: compatible with iOS <14.5 (promise overload unavailable)
  return new Promise(function(resolve, reject) {
    ctx.decodeAudioData(buf, resolve, reject);
  });
}

function unlockAudioCtx(ctx) {
  // Plays inaudible 1-sample buffer — primes iOS audio pipeline after resume()
  var buf = ctx.createBuffer(1, 1, 22050);
  var src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
}

if (typeof module !== 'undefined') module.exports = { createAudioCtx, decodeAudioBuffer, unlockAudioCtx };
