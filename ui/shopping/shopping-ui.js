var TILE_COLOURS=['#FFF0E0','#EAF4FF','#F0FFF4','#FFF0FA','#FFF5E0','#F5EEFF','#F0F8FF','#FFFBEA','#FFF0F0','#E8FFF0'];
let allItems=[],listItems=[];

export function setAllItems(items){allItems=items;}
export function getListItems(){return listItems;}
export function resetListItems(){listItems=[];}
export function filterListItems(fn){listItems=listItems.filter(fn);}

import { flattenCatalogs, escHtml, byName } from '../../core/shopping/shopping-core.js';
export { flattenCatalogs, escHtml, byName };
import { showBanner, hideBanner } from '../shared/success-banner.js';

export function renderTiles(items=allItems){
  var wrap=document.getElementById('tiles');
  wrap.innerHTML='';
  items.filter(function(it){return listItems.indexOf(it)<0;}).slice().sort(byName).forEach(function(it,i){
    var btn=document.createElement('button');
    btn.className='ctile';
    btn.style.background=TILE_COLOURS[i%TILE_COLOURS.length];
    btn.innerHTML='<span class="ctile-icon">'+it.icon+'</span><span class="ctile-name">'+escHtml(it.name)+'</span>';
    btn.onclick=function(){addToList(it);};
    wrap.appendChild(btn);
  });
}

var EMPTY_HTML = { 'true': () => '<div id="empty-list">Tap items to add them</div>', 'false': () => '' };

export function renderList(){
  var wrap=document.getElementById('list-items');
  var empty=listItems.length===0;
  wrap.innerHTML=EMPTY_HTML[String(empty)]();
  document.getElementById('btn-find').disabled=empty;
  [document.getElementById('btn-scan-it')].filter(Boolean).forEach(btn => { btn.disabled=empty; });
  listItems.slice().sort(byName).forEach(function(it){
    var row=document.createElement('div');
    row.className='list-row';
    row.innerHTML='<span class="list-icon">'+it.icon+'</span><span class="list-name">'+escHtml(it.name)+'</span><button class="list-remove">✕</button>';
    row.querySelector('.list-remove').onclick=function(){removeFromList(it);};
    wrap.appendChild(row);
  });
}

function addToList(it){listItems.push(it);renderList();renderTiles();}
function removeFromList(it){listItems.splice(listItems.indexOf(it),1);renderList();renderTiles();}

function _setPhase1(v){
  document.getElementById('phase1').style.display=v;
  [document.getElementById('filter-bar')].filter(Boolean).forEach(fb => { fb.style.display=v; });
}
export function hidePhase1(){_setPhase1('none');}
export function showPhase1(){_setPhase1('flex');}

export function showSuccess(onReset) {
  showBanner({ fullscreen: true, icon: '\u2705', text: 'Well done!', buttons: [{
    label: 'Play Again!',
    onClick: function() { hideBanner(); onReset(); }
  }]});
}

export function startFindPhase(onReset){
  hidePhase1();
  var p2=document.getElementById('phase2');
  p2.style.display='flex';
  var fl=document.getElementById('find-list');
  fl.innerHTML='';
  var found=0,crossed=0;
  var CHECK_DONE = { 'true': () => setTimeout(function(){showSuccess(onReset);}, 400), 'false': () => {} };
  function checkDone(){ CHECK_DONE[String(found+crossed===listItems.length)](); }
  var DEC = { found: () => found--, crossed: () => crossed-- };
  listItems.slice().sort(byName).forEach(function(it){
    var row=document.createElement('div');
    row.className='find-row';
    row.innerHTML='<span class="find-icon">'+it.icon+'</span><span class="find-name">'+escHtml(it.name)+'</span><span class="find-tick"></span><button class="btn-got">Got it! ✓</button><button class="btn-cross">Not here ✕</button><button class="btn-undo">Undo</button>';
    row.querySelector('.btn-got').onclick=function(){row.classList.add('found');row.querySelector('.find-tick').textContent='✅';found++;checkDone();};
    row.querySelector('.btn-cross').onclick=function(){row.classList.add('crossed');row.querySelector('.find-tick').textContent='✕';crossed++;checkDone();};
    row.querySelector('.btn-undo').onclick=function(){
      ['found','crossed'].forEach(cls => {
        [cls].filter(c => row.classList.contains(c)).forEach(() => { row.classList.remove(cls); DEC[cls](); });
      });
      row.querySelector('.find-tick').textContent='';
    };
    fl.appendChild(row);
  });
}
