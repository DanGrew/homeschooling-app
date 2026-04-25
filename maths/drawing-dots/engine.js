var shapeIdx=0,selectedDot=null,completedEdges,adj,complete;

function ns(tag,attrs){
  var el=document.createElementNS('http://www.w3.org/2000/svg',tag);
  Object.keys(attrs).forEach(function(k){el.setAttribute(k,String(attrs[k]));});
  return el;
}

function edgeKey(a,b){return Math.min(a,b)+','+Math.max(a,b);}

function buildAdj(shape){
  var a=shape.dots.map(function(){return [];});
  shape.edges.forEach(function(e){a[e[0]].push(e[1]);a[e[1]].push(e[0]);});
  return a;
}

function dotR(vbW){return Math.max(2,Math.round(vbW*0.055));}

function render(){
  var shape=shapes[shapeIdx];
  adj=buildAdj(shape);
  completedEdges=new Set();
  complete=false;
  selectedDot=null;

  document.getElementById('title').textContent=shape.name;
  document.getElementById('done').style.display='none';

  var vbP=shape.vb.split(' ').map(Number);
  var r=dotR(vbP[2]);
  var svg=document.getElementById('svg');
  svg.setAttribute('viewBox',shape.vb);
  svg.innerHTML='';

  var bg=document.createElementNS('http://www.w3.org/2000/svg','g');
  bg.setAttribute('id','bg');
  bg.setAttribute('opacity','0.2');
  bg.innerHTML=shape.decor;
  svg.appendChild(bg);

  var guides=document.createElementNS('http://www.w3.org/2000/svg','g');
  shape.edges.forEach(function(e){
    var a=shape.dots[e[0]],b=shape.dots[e[1]];
    guides.appendChild(ns('line',{
      x1:a.cx,y1:a.cy,x2:b.cx,y2:b.cy,
      stroke:'#ddd','stroke-width':Math.max(0.5,r*0.12),'stroke-dasharray':'4 3'
    }));
  });
  svg.appendChild(guides);

  var linesG=document.createElementNS('http://www.w3.org/2000/svg','g');
  linesG.setAttribute('id','lines');
  svg.appendChild(linesG);

  svg.appendChild(makeDotsGroup(shape,r));
  updateInstruction();
}

function makeDotsGroup(shape,r){
  var fs=Math.round(r*0.85);
  var sw=Math.max(0.3,r*0.15);
  var g=document.createElementNS('http://www.w3.org/2000/svg','g');
  g.setAttribute('id','dots');
  shape.dots.forEach(function(d,i){
    var allDone=adj[i].length>0&&adj[i].every(function(n){return completedEdges.has(edgeKey(i,n));});
    var isSel=selectedDot===i;
    var fill=allDone?'#2ECC71':isSel?'#F39C12':'white';
    var stroke=allDone?'#27AE60':isSel?'#E67E22':'#444';
    var tFill=allDone||isSel?'white':'#333';
    var dg=document.createElementNS('http://www.w3.org/2000/svg','g');
    dg.setAttribute('id','dot'+i);
    dg.style.cursor='pointer';
    dg.appendChild(ns('circle',{cx:d.cx,cy:d.cy,r:r,fill:fill,stroke:stroke,'stroke-width':sw}));
    var t=document.createElementNS('http://www.w3.org/2000/svg','text');
    t.setAttribute('x',d.cx);t.setAttribute('y',d.cy);
    t.setAttribute('font-size',fs);t.setAttribute('font-weight','bold');
    t.setAttribute('text-anchor','middle');t.setAttribute('dominant-baseline','central');
    t.setAttribute('fill',tFill);t.textContent=d.id;
    dg.appendChild(t);
    dg.addEventListener('click',function(){tap(i);});
    g.appendChild(dg);
  });
  return g;
}

function refreshDots(){
  var shape=shapes[shapeIdx];
  var vbP=shape.vb.split(' ').map(Number);
  var r=dotR(vbP[2]);
  var svg=document.getElementById('svg');
  var old=document.getElementById('dots');
  if(old)svg.removeChild(old);
  svg.appendChild(makeDotsGroup(shape,r));
}

function tap(i){
  if(complete)return;
  if(selectedDot===null){
    selectedDot=i;refreshDots();updateInstruction();return;
  }
  if(selectedDot===i){
    selectedDot=null;refreshDots();updateInstruction();return;
  }
  var key=edgeKey(selectedDot,i);
  if(completedEdges.has(key)){
    selectedDot=null;refreshDots();updateInstruction();return;
  }
  if(adj[selectedDot].indexOf(i)>=0){
    var a=shapes[shapeIdx].dots[selectedDot],b=shapes[shapeIdx].dots[i];
    drawLine(a.cx,a.cy,b.cx,b.cy);
    completedEdges.add(key);
    selectedDot=null;
    if(completedEdges.size===shapes[shapeIdx].edges.length){
      complete=true;refreshDots();revealImage();
    }else{
      refreshDots();updateInstruction();
    }
  }else{
    flashDot(i);
  }
}

function drawLine(x1,y1,x2,y2){
  var vbP=shapes[shapeIdx].vb.split(' ').map(Number);
  var r=dotR(vbP[2]);
  var len=Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
  var line=ns('line',{
    x1:x1,y1:y1,x2:x2,y2:y2,
    stroke:'#3498DB',
    'stroke-width':Math.max(1,Math.round(r*0.3)),
    'stroke-linecap':'round',
    'stroke-dasharray':len,
    'stroke-dashoffset':len
  });
  document.getElementById('lines').appendChild(line);
  line.getBoundingClientRect();
  line.style.transition='stroke-dashoffset 0.35s ease';
  line.setAttribute('stroke-dashoffset','0');
}

function flashDot(i){
  var el=document.getElementById('dot'+i);
  if(!el)return;
  var c=el.querySelector('circle');
  if(!c)return;
  c.classList.remove('dot-wrong');
  void c.offsetWidth;
  c.classList.add('dot-wrong');
  setTimeout(function(){c.classList.remove('dot-wrong');},400);
}

function revealImage(){
  updateInstruction('');
  var bg=document.getElementById('bg');
  if(!bg){setTimeout(showDone,600);return;}
  var start=null,from=0.2,dur=900;
  function step(ts){
    if(!start)start=ts;
    var t=Math.min((ts-start)/dur,1);
    bg.setAttribute('opacity',String(from+(1-from)*t));
    if(t<1)requestAnimationFrame(step);else showDone();
  }
  requestAnimationFrame(step);
}

function showDone(){
  document.getElementById('done').style.display='flex';
}

function updateInstruction(msg){
  var el=document.getElementById('instruction');
  if(msg!==undefined){el.textContent=msg;return;}
  if(selectedDot!==null){
    el.innerHTML='Now tap a dot connected to <b>'+shapes[shapeIdx].dots[selectedDot].id+'</b>!';
  }else if(completedEdges&&completedEdges.size>0){
    el.textContent='Keep going \u2014 tap any dot!';
  }else{
    el.textContent='Tap any dot to start!';
  }
}

function nextShape(){shapeIdx=(shapeIdx+1)%shapes.length;render();}
function prevShape(){shapeIdx=(shapeIdx+shapes.length-1)%shapes.length;render();}

render();
