var colours=['#E74C3C','#3498DB','#2ECC71','#F1C40F','#E67E22','#9B59B6'];
var types=['circle','square','triangle','star','rectangle','heart'];
var lastCol;

function svg(t,c,cssSize){
  cssSize=cssSize||'clamp(100px,28vmin,220px)';
  var s='<svg viewBox="0 0 120 120" style="width:'+cssSize+';height:'+cssSize+'">';
  if(t==='circle')s+='<circle cx="60" cy="60" r="54" fill="'+c+'"/>';
  else if(t==='square')s+='<rect x="8" y="8" width="104" height="104" rx="14" fill="'+c+'"/>';
  else if(t==='triangle')s+='<polygon points="60,8 112,112 8,112" fill="'+c+'"/>';
  else if(t==='star')s+='<polygon points="60,6 73,42 111,43 81,67 92,104 60,82 28,104 39,67 9,43 47,42" fill="'+c+'"/>';
  else if(t==='rectangle')s+='<rect x="8" y="28" width="104" height="64" rx="14" fill="'+c+'"/>';
  else s+='<path d="M60,95 C10,65 5,30 30,15 C45,8 57,22 60,32 C63,22 75,8 90,15 C115,30 110,65 60,95 Z" fill="'+c+'"/>';
  return s+'</svg>';
}

function pickCol(){
  var avail=colours.filter(function(x){return x!==lastCol;});
  var c=avail[Math.floor(Math.random()*avail.length)];
  lastCol=c;
  return c;
}
