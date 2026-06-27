var LC = {
  base: '../../../content/learning-catalogue/',
  iconMap: {},
  playgrounds: {},
  listEl: null,
  detailEl: null,
  chipsEl: null,
  searchEl: null,
  filterEl: null,
  talkPopEl: null,
  talkColsEl: null,
  groups: [],
  chips: [],
  chip: { type: 'all', id: 'all', label: 'All' },
  query: ''
};

function lcFetchJson(url) {
  return fetch(url).then(function(r) { return r.json(); });
}

function lcRenderListCard(learning) {
  var card = document.createElement('div');
  card.className = 'lc-card';
  card.setAttribute('data-testid', 'lc-card');
  card.innerHTML =
    '<div class="lc-row1"><span class="lc-ico">' + learning.icon + '</span>' +
    '<span class="lc-title">' + learning.title + '</span>' +
    '<span class="lc-licons">' + learning.learningIcons.map(function(id) { return LC.iconMap[id]; }).join(' ') + '</span></div>' +
    '<div class="lc-keys">' + learning.keywords.map(function(k) { return '<b>' + k + '</b>'; }).join(' · ') + '</div>' +
    '<div class="lc-venues">' + learning.playgrounds.map(function(v) { return '<span class="lc-vtag">' + LC.playgrounds[v.id].emoji + ' ' + LC.playgrounds[v.id].name + '</span>'; }).join('') + '</div>';
  card.addEventListener('click', function() { lcShowDetail(learning); });
  return card;
}

function lcRenderGroup(group) {
  var header = document.createElement('div');
  header.className = 'lc-area';
  header.textContent = group.title;
  LC.listEl.appendChild(header);
  group.learnings.forEach(function(learning) { LC.listEl.appendChild(lcRenderListCard(learning)); });
}

function lcRenderList(groups) {
  LC.listEl.innerHTML = '';
  groups.forEach(function(group) { lcRenderGroup(group); });
}

function lcShowDetail(learning) {
  LC.detailEl.innerHTML =
    '<a class="lc-back" data-testid="lc-back">← Back</a>' +
    '<div class="lc-hero">' + learning.icon + '</div>' +
    '<div class="lc-d-icons">' + learning.learningIcons.map(function(id) { return LC.iconMap[id]; }).join(' ') + '</div>' +
    '<div class="lc-sec"><div class="lc-lab">🎯 Focus</div><div class="lc-focus">' + learning.focus + '</div></div>' +
    '<div class="lc-sec"><div class="lc-lab">🏷 Keywords</div><div class="lc-pills">' + learning.keywords.map(function(k) { return '<span class="lc-pill">' + k + '</span>'; }).join('') + '</div></div>' +
    '<div class="lc-sec"><div class="lc-lab">🧠 Concepts</div><div class="lc-pills">' + learning.concepts.map(function(k) { return '<span class="lc-pill">' + k + '</span>'; }).join('') + '</div></div>' +
    '<div class="lc-sec"><div class="lc-lab">👀 Look for</div><ul class="lc-look">' + learning.lookFor.map(function(k) { return '<li>' + k + '</li>'; }).join('') + '</ul></div>' +
    '<div class="lc-sec"><div class="lc-lab">📚 Curriculum</div><div class="lc-pills">' + learning.curriculum.map(function(k) { return '<span class="lc-pill lc-cur">' + k + '</span>'; }).join('') + '</div></div>' +
    '<div class="lc-sec"><div class="lc-lab">▶ Where to practise</div>' + learning.playgrounds.map(function(v) { return '<a class="lc-venue" data-testid="lc-venue" href="' + activityHref(v.id) + '"><span class="lc-vi">' + LC.playgrounds[v.id].emoji + '</span><span class="lc-vt"><b>' + LC.playgrounds[v.id].name + '</b><span>' + v.note + '</span></span><span class="lc-go">▶</span></a>'; }).join('') + '</div>';
  LC.detailEl.querySelector('.lc-back').addEventListener('click', lcShowList);
  LC.filterEl.style.display = 'none';
  LC.listEl.style.display = 'none';
  LC.detailEl.style.display = 'block';
  window.scrollTo(0, 0);
}

function lcShowList() {
  LC.detailEl.style.display = 'none';
  LC.filterEl.style.display = 'block';
  LC.listEl.style.display = 'block';
}

function lcApplyFilter() {
  lcRenderList(lcFilter(LC.groups, LC.query, LC.chip));
}

function lcOnSearch(e) {
  LC.query = e.target.value;
  lcApplyFilter();
}

function lcRenderChip(chip) {
  var el = document.createElement('button');
  el.className = lcChipClass(chip, LC.chip);
  el.textContent = chip.label;
  el.setAttribute('data-testid', 'lc-chip');
  el.setAttribute('data-chip', chip.id);
  el.addEventListener('click', function() { lcSelectChip(chip); });
  LC.chipsEl.appendChild(el);
}

function lcRenderChips() {
  LC.chipsEl.innerHTML = '';
  LC.chips.forEach(lcRenderChip);
}

function lcSelectChip(chip) {
  LC.chip = chip;
  lcRenderChips();
  lcApplyFilter();
}

function lcReady(index, groups) {
  LC.groups = groups;
  LC.chips = lcBuildChips(index, lcAllLearnings(groups));
  LC.chip = LC.chips[0];
  lcRenderChips();
  lcApplyFilter();
}

function lcOpenTalk() {
  LC.talkPopEl.style.display = 'flex';
}

function lcCloseTalk() {
  LC.talkPopEl.style.display = 'none';
}

function lcOnIndex(index) {
  LC.iconMap = buildIconMap(index.learningIcons);
  LC.playgrounds = index.playgrounds;
  LC.talkColsEl.innerHTML = lcTalkColumnsHtml(index.talkPrompts);
  Promise.all(index.areas.map(function(area) {
    return lcFetchJson(LC.base + area.file).then(function(data) { return { learnings: data.learnings }; });
  })).then(function(payloads) {
    lcReady(index, assembleGroups(index.areas, payloads));
  });
}

function initLearningCatalogue() {
  LC.listEl = document.getElementById('lc-list');
  LC.detailEl = document.getElementById('lc-detail');
  LC.chipsEl = document.getElementById('lc-chips');
  LC.searchEl = document.getElementById('lc-search');
  LC.filterEl = document.getElementById('lc-filter');
  LC.talkPopEl = document.getElementById('lc-talk-pop');
  LC.talkColsEl = document.getElementById('lc-talk-cols');
  LC.searchEl.addEventListener('input', lcOnSearch);
  document.getElementById('lc-talk-btn').addEventListener('click', lcOpenTalk);
  document.getElementById('lc-talk-close').addEventListener('click', lcCloseTalk);
  document.getElementById('lc-talk-backdrop').addEventListener('click', lcCloseTalk);
  lcFetchJson(LC.base + 'index.json').then(lcOnIndex);
}
