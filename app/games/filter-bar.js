function buildFilterBar(items,onChange){
  var tags=['all'];
  items.forEach(function(p){(p.tags||[]).forEach(function(t){if(tags.indexOf(t)<0)tags.push(t);});});
  var bar=document.getElementById('filter-bar');
  tags.forEach(function(t){
    var b=document.createElement('button');
    b.textContent=t.charAt(0).toUpperCase()+t.slice(1);
    b.setAttribute('data-tag',t);
    b.style.cssText='padding:6px 14px;border-radius:12px;border:2px solid #ddd;background:#fff;font-family:inherit;font-size:0.95em;cursor:pointer;';
    b.onclick=function(){applyFilter(t,items,onChange);};
    bar.appendChild(b);
  });
  applyFilter('all',items,onChange);
}

function applyFilter(tag,items,onChange){
  var filtered=tag==='all'?items.slice():items.filter(function(p){return(p.tags||[]).indexOf(tag)>=0;});
  document.querySelectorAll('#filter-bar button').forEach(function(b){
    var active=b.getAttribute('data-tag')===tag;
    b.style.background=active?'#2ECC71':'#fff';
    b.style.color=active?'white':'#333';
    b.style.borderColor=active?'#27AE60':'#ddd';
  });
  onChange(filtered);
}
