import { CM_COLOURS, CM_MIXES, mix, hex, slotHtml } from '../../core/colour-mixing/colour-mixing-core.js';
export { CM_COLOURS, CM_MIXES, mix, hex };

const cfg=window.CM_CONFIG;
let slotA=null,slotB=null,sel=null,target=null;

function el(id){return document.getElementById(id);}

var PICK_POOL = { 'true': pool => pool, 'false': () => cfg.targets };
function pickTarget(){
  var pool=cfg.targets.filter(t=>t!==target);
  var src=PICK_POOL[String(pool.length>0)](pool);
  return src[Math.floor(Math.random()*src.length)];
}

var SW_OUTLINE = { 'true': () => '4px solid #333', 'false': () => 'none' };
var SW_TRANSFORM = { 'true': () => 'scale(1.12)', 'false': () => 'scale(1)' };
function applySwatchStyle(sw,c){ sw.style.outline=SW_OUTLINE[String(sel===c)](); sw.style.transform=SW_TRANSFORM[String(sel===c)](); }

function renderPalette(){
  cfg.palette.forEach(function(c){
    [el('cm-sw-'+c)].filter(Boolean).forEach(sw => applySwatchStyle(sw,c));
  });
}

function clearFeedback(){
  ['cm-slot-a','cm-slot-b'].forEach(function(id){[el(id)].filter(Boolean).forEach(s=>s.classList.remove('feedback-correct','feedback-wrong'));});
  [el('cm-result')].filter(Boolean).forEach(r=>{r.style.background='#f0f0f0';r.classList.remove('feedback-correct');});
}

var SLOT_BG = { 'true': cid => hex(cid), 'false': () => '#f0f0f0' };
function setSlotBg(id,cid){[el(id)].filter(Boolean).forEach(s=>{s.style.background=SLOT_BG[String(!!cid)](cid);});}

var EVAL_CLASS = { 'true': 'feedback-correct', 'false': 'feedback-wrong' };
var EVAL_CORRECT = { 'true': r=>{r.classList.add('feedback-correct');showBanner(function(){slotA=slotB=sel=null;target=pickTarget();buildUI();});}, 'false': ()=>{} };
function evaluate(){
  var result=mix(slotA,slotB);var r=el('cm-result');
  r.style.background=hex(result);
  var correct=result===target;
  el('cm-slot-a').classList.add(EVAL_CLASS[String(correct)]);
  el('cm-slot-b').classList.add(EVAL_CLASS[String(correct)]);
  EVAL_CORRECT[String(correct)](r);
}

function handleSwatch(c){sel=c;renderPalette();}

var SLOT_ASSIGN = { 'a': ()=>{slotA=sel;}, 'b': ()=>{slotB=sel;} };
var BOTH_FILLED = { 'true': evaluate, 'false': ()=>{} };
var SEL_GUARD = { 'true': ()=>{}, 'false': doHandleSlot };
function doHandleSlot(slot){
  clearFeedback();
  SLOT_ASSIGN[slot]();
  sel=null;setSlotBg('cm-slot-a',slotA);setSlotBg('cm-slot-b',slotB);
  renderPalette();
  BOTH_FILLED[String([slotA,slotB].every(Boolean))]();
}
function handleSlot(slot){ SEL_GUARD[String(!sel)](slot); }

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
