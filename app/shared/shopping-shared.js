var TILE_COLOURS=['#FFF0E0','#EAF4FF','#F0FFF4','#FFF0FA','#FFF5E0','#F5EEFF','#F0F8FF','#FFFBEA','#FFF0F0','#E8FFF0'];
var allItems=[],listItems=[];

function flattenCatalogs(catalogs){
  var out=[];
  catalogs.forEach(function(c){c.items.forEach(function(it){out.push({name:it.name,barcode:it.barcode,icon:it.icon,tags:c.tags,catalog:c.name});});});
  return out;
}

function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function byName(a,b){return a.name.localeCompare(b.name);}

function renderTiles(items){
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

function renderList(){
  var wrap=document.getElementById('list-items');
  wrap.innerHTML='';
  var empty=listItems.length===0;
  if(empty){wrap.innerHTML='<div id="empty-list">Tap items to add them</div>';}
  document.getElementById('btn-find').disabled=empty;
  var scanBtn=document.getElementById('btn-scan-it');
  if(scanBtn)scanBtn.disabled=empty;
  listItems.slice().sort(byName).forEach(function(it){
    var row=document.createElement('div');
    row.className='list-row';
    row.innerHTML='<span class="list-icon">'+it.icon+'</span><span class="list-name">'+escHtml(it.name)+'</span><button class="list-remove">✕</button>';
    row.querySelector('.list-remove').onclick=function(){removeFromList(it);};
    wrap.appendChild(row);
  });
}

function addToList(it){listItems.push(it);renderList();renderTiles(allItems);}
function removeFromList(it){listItems.splice(listItems.indexOf(it),1);renderList();renderTiles(allItems);}

function hidePhase1(){
  document.getElementById('phase1').style.display='none';
  var fb=document.getElementById('filter-bar');
  if(fb)fb.style.display='none';
}

function showPhase1(){
  document.getElementById('phase1').style.display='flex';
  var fb=document.getElementById('filter-bar');
  if(fb)fb.style.display='flex';
}

function showSuccess(){document.getElementById('success-banner').style.display='flex';}

function startFindPhase(){
  hidePhase1();
  var p2=document.getElementById('phase2');
  p2.style.display='flex';
  var fl=document.getElementById('find-list');
  fl.innerHTML='';
  var found=0,crossed=0;
  listItems.slice().sort(byName).forEach(function(it){
    var row=document.createElement('div');
    row.className='find-row';
    row.innerHTML='<span class="find-icon">'+it.icon+'</span><span class="find-name">'+escHtml(it.name)+'</span><span class="find-tick"></span><button class="btn-got">Got it! ✓</button><button class="btn-cross">Not here ✕</button><button class="btn-undo">Undo</button>';
    row.querySelector('.btn-got').onclick=function(){
      row.classList.add('found');
      row.querySelector('.find-tick').textContent='✅';
      found++;
      if(found+crossed===listItems.length)setTimeout(showSuccess,400);
    };
    row.querySelector('.btn-cross').onclick=function(){
      row.classList.add('crossed');
      row.querySelector('.find-tick').textContent='✕';
      crossed++;
      if(found+crossed===listItems.length)setTimeout(showSuccess,400);
    };
    row.querySelector('.btn-undo').onclick=function(){
      if(row.classList.contains('found')){row.classList.remove('found');found--;}
      else if(row.classList.contains('crossed')){row.classList.remove('crossed');crossed--;}
      row.querySelector('.find-tick').textContent='';
    };
    fl.appendChild(row);
  });
}
