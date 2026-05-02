(function(){
  function injectBanner(){
    var b=document.createElement('div');
    b.id='success-banner';
    b.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#2ECC71;color:white;display:flex;align-items:center;justify-content:space-between;padding:14px 20px;transform:translateY(100%);transition:transform 0.3s ease;z-index:100;box-sizing:border-box;';
    b.innerHTML='<span style="font-size:1.6em;">&#11088; Well done!</span><button id="success-next" style="background:white;color:#2ECC71;border:none;font-size:1.2em;padding:10px 24px;border-radius:12px;font-family:inherit;cursor:pointer;font-weight:bold;">Next &#8594;</button>';
    document.body.appendChild(b);
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',injectBanner);}
  else{injectBanner();}
})();

function ns(tag,attrs){
  var el=document.createElementNS('http://www.w3.org/2000/svg',tag);
  Object.keys(attrs).forEach(function(k){el.setAttribute(k,attrs[k]);});
  return el;
}

function injectDotPattern(svg){
  var defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
  var pat=document.createElementNS('http://www.w3.org/2000/svg','pattern');
  pat.setAttribute('id','dots');pat.setAttribute('width','6');pat.setAttribute('height','6');
  pat.setAttribute('patternUnits','userSpaceOnUse');
  var bg=document.createElementNS('http://www.w3.org/2000/svg','rect');
  bg.setAttribute('width','6');bg.setAttribute('height','6');bg.setAttribute('fill','#fff');
  var dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
  dot.setAttribute('cx','3');dot.setAttribute('cy','3');dot.setAttribute('r','1');dot.setAttribute('fill','#ccc');
  pat.appendChild(bg);pat.appendChild(dot);
  defs.appendChild(pat);
  svg.insertBefore(defs,svg.firstChild);
}

function showBanner(onNext){
  var b=document.getElementById('success-banner');
  b.style.transform='translateY(0)';
  document.getElementById('success-next').onclick=function(){hideBanner();onNext();};
}

function hideBanner(){
  var b=document.getElementById('success-banner');
  if(b)b.style.transform='translateY(100%)';
}

function loadColouringPictures(pictures,callback){
  Dictionary.loadAll(['colouring']).then(function(items){
    items.forEach(function(item){
      if(!item.colouring)return;
      pictures.push({name:item.name,tags:item.tags,vb:item.viewBox,shapes:item.colouring.shapes});
    });
    callback();
  }).catch(function(){callback();});
}
