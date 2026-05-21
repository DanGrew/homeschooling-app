export function w2r(deg){return(deg-90)*Math.PI/180;}

export function pieSeg(cx,cy,r,a1deg,a2deg,gap){
  var a1=w2r(a1deg+gap),a2=w2r(a2deg-gap);
  var x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
  var x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
  return 'M'+cx+' '+cy+' L'+x1+' '+y1+' A'+r+' '+r+' 0 0 1 '+x2+' '+y2+'Z';
}

export function annulusSeg(cx,cy,ro,ri,a1deg,a2deg,gap){
  var a1=w2r(a1deg+gap),a2=w2r(a2deg-gap);
  var x1o=cx+ro*Math.cos(a1),y1o=cy+ro*Math.sin(a1);
  var x2o=cx+ro*Math.cos(a2),y2o=cy+ro*Math.sin(a2);
  var x1i=cx+ri*Math.cos(a1),y1i=cy+ri*Math.sin(a1);
  var x2i=cx+ri*Math.cos(a2),y2i=cy+ri*Math.sin(a2);
  return 'M'+x1o+' '+y1o+' A'+ro+' '+ro+' 0 0 1 '+x2o+' '+y2o+
         ' L'+x2i+' '+y2i+' A'+ri+' '+ri+' 0 0 0 '+x1i+' '+y1i+'Z';
}

export function hex(id,colours){return colours[id].hex;}

export function lsnMix(a,b,mixes){return [mixes[a+'+'+b],a].filter(Boolean)[0];}

export function slotEvent(slot,colour){return colour.replace(/-/g,'_').toUpperCase()+'_LOADED_'+slot.toUpperCase();}

export function shuffled(arr){return arr.slice().sort(function(){return Math.random()-0.5;});}
