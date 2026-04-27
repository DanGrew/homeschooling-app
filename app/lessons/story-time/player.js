(function () {
  document.getElementById('story-title').textContent = CLIPS[LESSON.clips[0]].title;
  document.getElementById('words').textContent = 'Loading\u2026';

  Promise.all(LESSON.clips.map(function (clipId) {
    return fetch(CLIPS[clipId].annotationUrl).then(function (r) { return r.json(); });
  })).then(init).catch(function (err) {
    document.getElementById('words').textContent = 'Failed to load story data.';
    console.error(err);
  });

  function init(annotations) {
    var clips = LESSON.clips.map(function (clipId, i) {
      var ann = annotations[i];
      var words = [];
      ann.segments.forEach(function (seg) {
        seg.words.forEach(function (w) { words.push(w); });
      });
      return { clip: CLIPS[clipId], ann: ann, words: words };
    });

    var wordsEl = document.getElementById('words');
    var html = '';
    clips.forEach(function (c, ci) {
      if (ci > 0) html += '<div style="height:0.6em;"></div>';
      var wi = 0;
      c.ann.segments.forEach(function (seg, si) {
        if (si > 0) html += '<br>';
        seg.words.forEach(function (w) {
          html += '<span id="w' + ci + '_' + wi + '" style="display:inline-block;padding:4px 8px;border-radius:10px;transition:background 0.08s,color 0.08s;">' + w.w + '\u00a0</span>';
          wi++;
        });
      });
    });
    wordsEl.innerHTML = html;

    var audio = document.getElementById('aud');
    var currentClip = 0;
    var lastActive = -1;
    var playing = false;
    var rafId = null;
    var currentSpeed = 1;

    document.querySelectorAll('.speed-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentSpeed = parseFloat(this.dataset.speed);
        audio.playbackRate = currentSpeed;
        document.querySelectorAll('.speed-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    function wordEl(ci, wi) { return document.getElementById('w' + ci + '_' + wi); }

    function clearHighlight() {
      if (lastActive >= 0) {
        var el = wordEl(currentClip, lastActive);
        if (el) { el.style.background = ''; el.style.color = ''; }
        lastActive = -1;
      }
    }

    function loadClip(idx) {
      currentClip = idx;
      lastActive = -1;
      audio.src = clips[idx].clip.audioUrl;
      audio.load();
    }

    loadClip(0);

    audio.addEventListener('ended', function () {
      clearHighlight();
      if (currentClip + 1 < clips.length) {
        loadClip(currentClip + 1);
        audio.playbackRate = currentSpeed;
        audio.play();
      } else {
        playing = false;
        rafId = null;
        document.getElementById('playbtn').textContent = '\u25b6 Play';
        loadClip(0);
      }
    });

    document.getElementById('playbtn').addEventListener('click', function () {
      if (playing) {
        audio.pause();
        playing = false;
        cancelAnimationFrame(rafId);
        rafId = null;
        this.textContent = '\u25b6 Play';
      } else {
        audio.playbackRate = currentSpeed;
        audio.play();
        playing = true;
        this.textContent = '\u23f8 Pause';
        tick();
      }
    });

    document.getElementById('stopbtn').addEventListener('click', function () {
      audio.pause();
      playing = false;
      cancelAnimationFrame(rafId);
      rafId = null;
      clearHighlight();
      document.getElementById('playbtn').textContent = '\u25b6 Play';
      loadClip(0);
    });

    function activeIndex(t) {
      var words = clips[currentClip].words;
      var idx = -1;
      for (var i = 0; i < words.length; i++) {
        if (words[i].t <= t) idx = i;
        else break;
      }
      return idx;
    }

    function tick() {
      var idx = activeIndex(audio.currentTime);
      if (idx !== lastActive) {
        if (lastActive >= 0) {
          var prev = wordEl(currentClip, lastActive);
          if (prev) { prev.style.background = ''; prev.style.color = ''; }
        }
        if (idx >= 0) {
          var el = wordEl(currentClip, idx);
          if (el) {
            el.style.background = '#FFD700';
            el.style.color = '#222';
            var main = document.getElementById('main');
            main.scrollTo({ top: el.offsetTop - main.clientHeight / 2 + el.offsetHeight / 2, behavior: 'smooth' });
          }
        }
        lastActive = idx;
      }
      if (playing) rafId = requestAnimationFrame(tick);
    }
  }
})();
