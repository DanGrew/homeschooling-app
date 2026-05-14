'use strict';

// activity — full contract: nav-bar (all features or opted out) + speakable CSS/JS
// hub      — navigation layer, no contract checks
// exempt   — special layout, not standard activity pattern; requires reason

const PAGES = {
  'app/activities/character-lesson/index.html': 'activity',
  'app/activities/clock/game-mc.html':          'activity',
  'app/activities/clock/index.html':            'activity',
  'app/activities/colour-wheel/index.html':     'activity',
  'app/activities/colouring-palette/index.html':'activity',
  'app/activities/colouring/index.html':        'activity',
  'app/activities/connect-the-dots/index.html': 'activity',
  'app/activities/count-shapes/index.html':     'activity',
  'app/activities/drawing-dots/index.html':     'activity',
  'app/activities/logic-gates/puzzle.html':     'activity',
  'app/activities/logic-gates/sandbox.html':    'activity',
  'app/activities/match-colour-shape/index.html':'activity',
  'app/activities/match-colour/index.html':     'activity',
  'app/activities/match-shape/index.html':      'activity',
  'app/activities/move-blocks/index.html':      'activity',
  'app/activities/number-interaction/index.html':'activity',
  'app/activities/piano/game.html':             'activity',
  'app/activities/piano/lesson.html':           'activity',
  'app/activities/piano/songs.html':            'activity',
  'app/activities/primary-colours/index.html':  'activity',
  'app/activities/puzzle/index.html':           'activity',
  'app/activities/puzzle/play.html':            'activity',
  'app/activities/say-words/index.html':        'activity',
  'app/activities/secondary-colours/index.html':'activity',
  'app/activities/shopping-play/index.html':    'activity',
  'app/activities/shopping-scan/index.html':    'activity',
  'app/activities/word-lesson/index.html':      'activity',
  'app/activities/word-match/index.html':       'activity',
  'app/worksheets/character-worksheet/index.html':'activity',
  'app/worksheets/colouring-sheets/index.html': 'activity',

  'app/activities/simulator/index.html':  { type: 'exempt', reason: 'hub-style sim launcher, non-standard layout, no game-area' },
  'app/activities/story-time/index.html': { type: 'exempt', reason: 'panel sidebar layout, non-standard, no game-area' },
  'app/routine/index.html':               { type: 'exempt', reason: 'custom timeline UI, own header pattern, id=nav-bar not class' },

  'app/index.html':               'hub',
  'app/games/index.html':         'hub',
  'app/lessons/index.html':       'hub',
  'app/stories/index.html':       'hub',
  'app/worksheets/index.html':    'hub',
  'app/parental/index.html':      'hub',
  'app/curriculum/index.html':    'hub',
  'app/attributions.html':        'hub',
};

module.exports = { PAGES };
