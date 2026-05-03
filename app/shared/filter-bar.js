function buildFilterBar(items,onChange){
  var bar=document.getElementById('filter-bar');
  bar.innerHTML='';
  bar.style.cssText='display:flex;flex-direction:column;border-bottom:1px solid #eee;';

  var tags=['all'],levels=[];
  items.forEach(function(p){
    (p.tags||[]).forEach(function(t){if(tags.indexOf(t)<0)tags.push(t);});
    if(p.level!==undefined&&levels.indexOf(p.level)<0)levels.push(p.level);
  });
  levels.sort(function(a,b){return a-b;});

  var activeTag='all',activeLevel='all';

  function active(on,colour){
    return 'padding:6px 14px;border-radius:12px;border:2px solid '+(on?colour:'#ddd')+';background:'+(on?colour:'#fff')+';color:'+(on?'white':'#333')+';font-family:inherit;font-size:0.95em;cursor:pointer;';
  }

  function apply(){
    var filtered=items.filter(function(p){
      var tagOk=activeTag==='all'||(p.tags||[]).indexOf(activeTag)>=0;
      var levelOk=activeLevel==='all'||p.level===activeLevel;
      return tagOk&&levelOk;
    });
    bar.querySelectorAll('button[data-tag]').forEach(function(b){
      b.style.cssText=active(b.getAttribute('data-tag')===activeTag,'#2ECC71');
    });
    bar.querySelectorAll('button[data-level]').forEach(function(b){
      b.style.cssText=active(b.getAttribute('data-level')===String(activeLevel),'#3498DB');
    });
    onChange(filtered);
  }

  function row(extra){
    var d=document.createElement('div');
    d.style.cssText='display:flex;gap:8px;padding:8px 16px;flex-wrap:wrap;'+(extra||'');
    return d;
  }

  var tagRow=row();
  tags.forEach(function(t){
    var b=document.createElement('button');
    b.textContent=t.charAt(0).toUpperCase()+t.slice(1);
    b.setAttribute('data-tag',t);
    b.onclick=function(){activeTag=t;apply();};
    tagRow.appendChild(b);
  });
  bar.appendChild(tagRow);

  if(levels.length>0){
    var levelRow=row('border-top:1px solid #eee;');
    ['all'].concat(levels).forEach(function(l){
      var b=document.createElement('button');
      b.textContent=l==='all'?'All Levels':'Level '+l;
      b.setAttribute('data-level',String(l));
      b.onclick=function(){activeLevel=l;apply();};
      levelRow.appendChild(b);
    });
    bar.appendChild(levelRow);
  }

  apply();
}
