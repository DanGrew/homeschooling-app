(function () {
  var clips = LESSON.clips.map(function (clipId) {
    var ann = ANNOTATIONS[clipId];
    var words = [];
    ann.segments.forEach(function (seg) {
      seg.words.forEach(function (w) { words.push(w); });
    });
    return { clip: CLIPS[clipId], ann: ann, words: words };
  });

  var area = document.getElementById('player-area');

  var wordsHtml = '';
  clips.forEach(function (c, ci) {
    if (ci > 0) wordsHtml += '<div style="height:0.4em;"></div>';
    var wi = 0;
    c.ann.segments.forEach(function (seg, si) {
      if (si > 0) wordsHtml += '<br>';
      seg.words.forEach(function (w) {
        wordsHtml += '<span id="w' + ci + '_' + wi + '" style="display:inline-block;padding:4px 8px;border-radius:10px;transition:background 0.08s,color 0.08s;">' + w.w + '\u00a0</span>';
        wi++;
      });
    });
  });

  area.innerHTML =
    '<div style="width:100%;max-width:680px;background:#fff;border-radius:20px;box-shadow:0 4px 16px rgba(0,0,0,0.1);padding:28px 24px;">' +
    '<div style="font-size:1.3em;color:#9B59B6;text-align:center;margin-bottom:20px;">' + CLIPS[LESSON.clips[0]].title + '</div>' +
    '<div id="words" style="font-size:2em;line-height:2.2;text-align:center;margin-bottom:28px;min-height:100px;">' + wordsHtml + '</div>' +
    '<audio id="aud" preload="auto"></audio>' +
    '<div style="display:flex;justify-content:center;gap:16px;">' +
    '<button id="playbtn" onclick="togglePlay()" style="font-family:inherit;font-size:1.2em;padding:14px 36px;border:none;border-radius:16px;background:#9B59B6;color:#fff;cursor:pointer;touch-action:manipulation;">\u25b6 Play</button>' +
    '</div></div>';

  var audio = document.getElementById('aud');
  var currentClip = 0;
  var lastActive = -1;
  var playing = false;
  var rafId = null;

  function loadClip(idx) {
    currentClip = idx;
    lastActive = -1;
    audio.src = clips[idx].clip.audioUrl;
    audio.load();
  }

  loadClip(0);

  audio.addEventListener('ended', function () {
    if (currentClip + 1 < clips.length) {
      loadClip(currentClip + 1);
      audio.play();
    } else {
      playing = false;
      document.getElementById('playbtn').textContent = '\u25b6 Play';
      cancelAnimationFrame(rafId);
    }
  });

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

  function activeIndex(t) {
    var words = clips[currentClip].words;
    var idx = -1;
    for (var i = 0; i < words.length; i++) {
      if (words[i].t <= t) idx = i;
      else break;
    }
    return idx;
  }

  function wordId(clipIdx, wordIdx) {
    return 'w' + clipIdx + '_' + wordIdx;
  }

  function tick() {
    var idx = activeIndex(audio.currentTime);
    if (idx !== lastActive) {
      if (lastActive >= 0) {
        var prev = document.getElementById(wordId(currentClip, lastActive));
        if (prev) { prev.style.background = ''; prev.style.color = ''; }
      }
      if (idx >= 0) {
        var el = document.getElementById(wordId(currentClip, idx));
        if (el) { el.style.background = '#FFD700'; el.style.color = '#222'; }
      }
      lastActive = idx;
    }
    if (playing) rafId = requestAnimationFrame(tick);
  }
})();
