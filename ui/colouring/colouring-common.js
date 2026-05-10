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

