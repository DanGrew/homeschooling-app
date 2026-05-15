import { activeIndex } from '../../core/story-time/story-time-core.js';
import { speak } from '../../components/speech/speech-ui.js';

(function () {
  var storyParam = new URLSearchParams(window.location.search).get('story');
  var storyId = [storyParam, 'david-and-goliath'][+!storyParam];
  var LESSON = [LESSONS[storyId], LESSONS['david-and-goliath']][+!LESSONS[storyId]];
  document.getElementById('story-title').textContent = LESSON.title;
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
      html += ['', '<div style="height:0.6em;"></div>'][+!!ci];
      var wi = 0;
      c.ann.segments.forEach(function (seg, si) {
        html += ['', '<br>'][+!!si];
        seg.words.forEach(function (w) {
          var dictAttrs = ['', ' class="dict-word" data-dict="' + w.dict + '"'][+!!w.dict];
          html += '<span id="w' + ci + '_' + wi + '"' + dictAttrs + ' style="display:inline-block;padding:4px 8px;border-radius:10px;transition:background 0.08s,color 0.08s;">' + w.w + '\u00a0</span>';
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
    var pausedForDict = false;
    var dictSavedTime = 0;
    var DICT_BASE = '../../../content/dictionary/entries/';
    var dictOverlay = document.getElementById('dict-overlay');

    document.querySelectorAll('.speed-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentSpeed = parseFloat(this.dataset.speed);
        audio.playbackRate = currentSpeed;
        document.querySelectorAll('.speed-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    function wordEl(ci, wi) { return document.getElementById('w' + ci + '_' + wi); }

    function unhighlightWord(el) {
      el.style.background = '';
      el.style.color = '';
    }

    function highlightWord(el) {
      el.style.background = '#FFD700';
      el.style.color = '#222';
      var main = document.getElementById('main');
      main.scrollTo({ top: el.offsetTop - main.clientHeight / 2 + el.offsetHeight / 2, behavior: 'smooth' });
    }

    function clearHighlight() {
      var active = lastActive;
      var el = [null, wordEl(currentClip, active)][+(active >= 0)];
      [el].filter(Boolean).forEach(unhighlightWord);
      lastActive = [-1, active][+(active < 0)];
    }

    function loadClip(idx) {
      currentClip = idx;
      lastActive = -1;
      audio.src = clips[idx].clip.audioUrl;
      audio.load();
    }

    loadClip(0);

    function onClipEndedNext() {
      loadClip(currentClip + 1);
      audio.playbackRate = currentSpeed;
      audio.play();
    }
    function onClipEndedLast() {
      playing = false;
      rafId = null;
      document.getElementById('playbtn').textContent = '\u25b6 Play';
      loadClip(0);
    }
    var ON_CLIP_ENDED = {
      'true': onClipEndedNext,
      'false': onClipEndedLast,
    };

    audio.addEventListener('ended', function () {
      clearHighlight();
      ON_CLIP_ENDED[String(currentClip + 1 < clips.length)]();
    });

    function doPause(btn) {
      audio.pause();
      playing = false;
      cancelAnimationFrame(rafId);
      rafId = null;
      btn.textContent = '\u25b6 Play';
    }
    function doPlay(btn) {
      audio.playbackRate = currentSpeed;
      audio.play();
      playing = true;
      btn.textContent = '\u23f8 Pause';
      tick();
    }
    var PLAY_TOGGLE = {
      'true': doPause,
      'false': doPlay,
    };

    document.getElementById('playbtn').addEventListener('click', function () {
      PLAY_TOGGLE[String(playing)](this);
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

    function activeIdx(t) {
      return activeIndex(t, clips[currentClip].words);
    }

    wordsEl.addEventListener('click', function (e) {
      var span = e.target.closest('.dict-word');
      [span].filter(Boolean).forEach(function (s) { openDict(s.dataset.dict); });
    });

    document.getElementById('dict-close').addEventListener('click', closeDict);
    dictOverlay.addEventListener('click', function (e) {
      ({ 'true': closeDict, 'false': function () {} })[String(e.target === dictOverlay)]();
    });
    document.getElementById('dict-speak').addEventListener('click', function () {
      speak(document.getElementById('dict-word-text').textContent);
    });

    function pauseForDict() {
      dictSavedTime = audio.currentTime;
      audio.pause();
      cancelAnimationFrame(rafId);
      rafId = null;
      playing = false;
      pausedForDict = true;
      document.getElementById('playbtn').textContent = '\u25b6 Play';
    }
    var PAUSE_FOR_DICT = {
      'true': pauseForDict,
      'false': function () {},
    };

    function openDict(conceptId) {
      PAUSE_FOR_DICT[String(playing)]();
      var imgEl = document.getElementById('dict-img');
      imgEl.style.display = 'none';
      imgEl.src = '';
      document.getElementById('dict-word-text').textContent = '';
      document.getElementById('dict-phonics').textContent = '';
      dictOverlay.classList.add('open');
      fetch(DICT_BASE + conceptId + '/concept.json')
        .then(function (r) { return r.json(); })
        .then(function (c) {
          document.getElementById('dict-word-text').textContent = c.name;
          document.getElementById('dict-phonics').textContent = c.phonetic;
        });
      fetch(DICT_BASE + conceptId + '/image.json')
        .then(function (r) { return r.json(); })
        .then(function (img) {
          imgEl.src = '../../../content/dictionary/' + img.src;
          imgEl.style.display = '';
        })
        .catch(function () {});
    }

    function resumeFromDict() {
      pausedForDict = false;
      audio.currentTime = dictSavedTime;
      audio.playbackRate = currentSpeed;
      audio.play();
      playing = true;
      document.getElementById('playbtn').textContent = '\u23f8 Pause';
      tick();
    }
    var RESUME_FROM_DICT = {
      'true': resumeFromDict,
      'false': function () {},
    };

    function closeDict() {
      dictOverlay.classList.remove('open');
      RESUME_FROM_DICT[String(pausedForDict)]();
    }

    function clearPrevWord() {
      var prev = wordEl(currentClip, lastActive);
      [prev].filter(Boolean).forEach(unhighlightWord);
    }
    function activateNewWord(idx) {
      var el = wordEl(currentClip, idx);
      [el].filter(Boolean).forEach(highlightWord);
    }
    var CLEAR_PREV = {
      'true': clearPrevWord,
      'false': function () {},
    };
    var ACTIVATE_NEW = {
      'true': activateNewWord,
      'false': function () {},
    };
    function applyWordChange(idx) {
      CLEAR_PREV[String(lastActive >= 0)]();
      ACTIVATE_NEW[String(idx >= 0)](idx);
      lastActive = idx;
    }
    var APPLY_CHANGE = {
      'true': applyWordChange,
      'false': function () {},
    };
    var SCHEDULE_TICK = {
      'true': function () { rafId = requestAnimationFrame(tick); },
      'false': function () {},
    };

    function tick() {
      var idx = activeIdx(audio.currentTime);
      APPLY_CHANGE[String(idx !== lastActive)](idx);
      SCHEDULE_TICK[String(playing)]();
    }
  }
})();
