(function () {
  var clipId = LESSON.clips[0];
  var clip = CLIPS[clipId];
  var ann = ANNOTATIONS[clipId];

  var allWords = [];
  var wordsHtml = '';
  var idx = 0;
  ann.segments.forEach(function (seg, si) {
    if (si > 0) wordsHtml += '<br>';
    seg.words.forEach(function (w) {
      allWords.push(w);
      wordsHtml += '<span id="w' + idx + '" style="display:inline-block;padding:4px 8px;border-radius:10px;transition:background 0.08s,color 0.08s;">' + w.w + '\u00a0</span>';
      idx++;
    });
  });

  var area = document.getElementById('player-area');

  area.innerHTML =
    '<div style="width:100%;max-width:680px;background:#fff;border-radius:20px;box-shadow:0 4px 16px rgba(0,0,0,0.1);padding:28px 24px;">' +
    '<div style="font-size:1.3em;color:#9B59B6;text-align:center;margin-bottom:20px;">' + clip.title + '</div>' +
    '<div id="words" style="font-size:2em;line-height:2.2;text-align:center;margin-bottom:28px;min-height:100px;">' + wordsHtml + '</div>' +
    '<audio id="aud" src="' + clip.audioUrl + '" preload="auto"></audio>' +
    '<div style="display:flex;justify-content:center;gap:16px;">' +
    '<button id="playbtn" onclick="togglePlay()" style="font-family:inherit;font-size:1.2em;padding:14px 36px;border:none;border-radius:16px;background:#9B59B6;color:#fff;cursor:pointer;touch-action:manipulation;">\u25b6 Play</button>' +
    '</div></div>';

  var audio = document.getElementById('aud');
  var rafId = null;
  var lastActive = -1;
  var playing = false;

  window.togglePlay = function () {
    if (playing) {
      audio.pause();
      playing = false;
      document.getElementById('playbtn').textContent = '\u25b6 Play';
      cancelAnimationFrame(rafId);
    } else {
      audio.play();
      playing = true;
      document.getElementById('playbtn').textContent = '\u23f8 Pause';
      tick();
    }
  };

  audio.addEventListener('ended', function () {
    playing = false;
    document.getElementById('playbtn').textContent = '\u25b6 Play';
    cancelAnimationFrame(rafId);
  });

  function activeIndex(t) {
    var idx = -1;
    for (var i = 0; i < allWords.length; i++) {
      if (allWords[i].t <= t) idx = i;
      else break;
    }
    return idx;
  }

  function tick() {
    var idx = activeIndex(audio.currentTime);
    if (idx !== lastActive) {
      if (lastActive >= 0) {
        var prev = document.getElementById('w' + lastActive);
        prev.style.background = '';
        prev.style.color = '';
      }
      if (idx >= 0) {
        var el = document.getElementById('w' + idx);
        el.style.background = '#FFD700';
        el.style.color = '#222';
      }
      lastActive = idx;
    }
    if (playing) rafId = requestAnimationFrame(tick);
  }
})();
