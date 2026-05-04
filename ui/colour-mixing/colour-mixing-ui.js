import { CM_COLOURS, CM_MIXES, mix, hex } from '../../core/colour-mixing/colour-mixing-core.js';
export { CM_COLOURS, CM_MIXES, mix, hex };

const cfg=window.CM_CONFIG;
let slotA=null,slotB=null,sel=null,target=null;

function el(id){return document.getElementById(id);}
function pickTarget(){var pool=cfg.targets.filter(t=>t!==target);return(pool.length?pool:cfg.targets)[Math.floor(Math.random()*(pool.length||cfg.targets.length))];}
function slotHtml(id,lbl){return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;"><div id="'+id+'" style="width:76px;height:76px;border-radius:50%;border:4px solid #ddd;background:#f0f0f0;cursor:pointer;"></div><div style="font-size:0.85em;color:#bbb;font-weight:bold;">'+lbl+'</div></div>';}

function renderPalette(){
  cfg.palette.forEach(function(c){
    var sw=el('cm-sw-'+c);
    sw&&(sw.style.outline=sel===c?'4px solid #333':'none',sw.style.transform=sel===c?'scale(1.12)':'scale(1)');
  });
}

function clearFeedback(){
  ['cm-slot-a','cm-slot-b'].forEach(function(id){var s=el(id);s&&s.classList.remove('feedback-correct','feedback-wrong');});
  var r=el('cm-result');r&&(r.style.background='#f0f0f0',r.classList.remove('feedback-correct'));
}

function setSlotBg(id,cid){var s=el(id);s&&(s.style.background=cid?hex(cid):'#f0f0f0');}

function evaluate(){
  var result=mix(slotA,slotB);var r=el('cm-result');
  r.style.background=hex(result);
  var correct=result===target;
  el('cm-slot-a').classList.add(correct?'feedback-correct':'feedback-wrong');
  el('cm-slot-b').classList.add(correct?'feedback-correct':'feedback-wrong');
  correct&&(r.classList.add('feedback-correct'),showBanner(function(){slotA=slotB=sel=null;target=pickTarget();buildUI();}));
}

function handleSwatch(c){sel=c;renderPalette();}

function handleSlot(slot){
  if(!sel) return;
  clearFeedback();
  slot==='a'?slotA=sel:slotB=sel;
  sel=null;setSlotBg('cm-slot-a',slotA);setSlotBg('cm-slot-b',slotB);
  renderPalette();slotA&&slotB&&evaluate();
}

function buildUI(){
  var root=el('cm-root');
  root.style.cssText='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:12px;overflow:hidden;';
  root.innerHTML=
    '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;"><div style="font-size:1em;color:#999;">Mix to make:</div><div id="cm-target-swatch" style="width:90px;height:90px;border-radius:50%;background:'+hex(target)+';box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div><div id="cm-target-label" style="font-size:1.1em;font-weight:bold;color:#333;">'+CM_COLOURS[target].label+'</div></div>'+
    '<div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-shrink:0;">'+slotHtml('cm-slot-a','A')+'<div style="font-size:1.6em;color:#ccc;font-weight:bold;">+</div>'+slotHtml('cm-slot-b','B')+'<div style="font-size:1.6em;color:#ccc;font-weight:bold;">=</div><div style="display:flex;flex-direction:column;align-items:center;gap:4px;"><div id="cm-result" style="width:76px;height:76px;border-radius:50%;border:4px solid #ddd;background:#f0f0f0;"></div><div style="font-size:0.85em;color:#bbb;">Result</div></div></div>'+
    '<div id="cm-palette" style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;flex-shrink:0;"></div>';
  el('cm-slot-a').addEventListener('click',function(){handleSlot('a');});
  el('cm-slot-b').addEventListener('click',function(){handleSlot('b');});
  cfg.palette.forEach(function(c){
    var sw=document.createElement('div');sw.id='cm-sw-'+c;
    sw.style.cssText='width:60px;height:60px;border-radius:50%;background:'+hex(c)+';cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.15);transition:transform 0.15s;outline-offset:3px;';
    sw.addEventListener('click',function(){handleSwatch(c);});el('cm-palette').appendChild(sw);
  });
}

target=pickTarget();buildUI();
