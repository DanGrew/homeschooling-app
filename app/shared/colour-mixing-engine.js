import { CM_COLOURS, CM_MIXES, mix, hex } from './colour-mixing-logic.js';
export { CM_COLOURS, CM_MIXES, mix, hex };

if(typeof document!=='undefined'){
  const cfg=window.CM_CONFIG;
  let slotA=null,slotB=null,sel=null,target=null;

  function el(id){return document.getElementById(id);}

  function pickTarget(){
    var pool=cfg.targets.filter(function(t){return t!==target;});
    if(!pool.length) pool=cfg.targets;
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function renderPalette(){
    cfg.palette.forEach(function(c){
      var sw=el('cm-sw-'+c);
      if(!sw) return;
      sw.style.outline=sel===c?'4px solid #333':'none';
      sw.style.transform=sel===c?'scale(1.12)':'scale(1)';
    });
  }

  function clearFeedback(){
    ['cm-slot-a','cm-slot-b'].forEach(function(id){
      var s=el(id);if(s){s.classList.remove('feedback-correct','feedback-wrong');}
    });
    var r=el('cm-result');
    if(r){r.style.background='#f0f0f0';r.classList.remove('feedback-correct');}
  }

  function setSlotBg(id,cid){
    var s=el(id);
    if(!s) return;
    s.style.background=cid?hex(cid):'#f0f0f0';
  }

  function evaluate(){
    var result=mix(slotA,slotB);
    var r=el('cm-result');
    r.style.background=hex(result);
    var correct=result===target;
    var feedbackClass=correct?'feedback-correct':'feedback-wrong';
    el('cm-slot-a').classList.add(feedbackClass);
    el('cm-slot-b').classList.add(feedbackClass);
    if(correct) r.classList.add('feedback-correct');
    if(correct){
      showBanner(function(){
        slotA=slotB=sel=null;
        target=pickTarget();
        buildUI();
      });
    }
  }

  function handleSwatch(c){
    sel=c;
    renderPalette();
  }

  function handleSlot(slot){
    if(!sel) return;
    clearFeedback();
    if(slot==='a'){
      slotA=sel;
    } else {
      slotB=sel;
    }
    sel=null;
    setSlotBg('cm-slot-a',slotA);
    setSlotBg('cm-slot-b',slotB);
    renderPalette();
    if(slotA&&slotB) evaluate();
  }

  function buildUI(){
    var root=el('cm-root');
    root.innerHTML='';
    root.style.cssText='flex:1;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:12px;overflow:hidden;';

    var ta=document.createElement('div');
    ta.style.cssText='display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;';
    ta.innerHTML='<div style="font-size:1em;color:#999;">Mix to make:</div>'+
      '<div id="cm-target-swatch" style="width:90px;height:90px;border-radius:50%;background:'+hex(target)+';box-shadow:0 2px 8px rgba(0,0,0,0.25);"></div>'+
      '<div id="cm-target-label" style="font-size:1.1em;font-weight:bold;color:#333;">'+CM_COLOURS[target].label+'</div>';
    root.appendChild(ta);

    var mr=document.createElement('div');
    mr.style.cssText='display:flex;align-items:center;justify-content:center;gap:10px;flex-shrink:0;';

    function mkSlot(id,key){
      var w=document.createElement('div');
      w.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;';
      var s=document.createElement('div');
      s.id=id;
      s.style.cssText='width:76px;height:76px;border-radius:50%;border:4px solid #ddd;background:#f0f0f0;cursor:pointer;';
      s.addEventListener('click',function(){handleSlot(key);});
      var l=document.createElement('div');
      l.style.cssText='font-size:0.85em;color:#bbb;font-weight:bold;';
      l.textContent=key.toUpperCase();
      w.appendChild(s);w.appendChild(l);
      return w;
    }

    function mkOp(t){
      var d=document.createElement('div');
      d.style.cssText='font-size:1.6em;color:#ccc;font-weight:bold;';
      d.textContent=t;
      return d;
    }

    mr.appendChild(mkSlot('cm-slot-a','a'));
    mr.appendChild(mkOp('+'));
    mr.appendChild(mkSlot('cm-slot-b','b'));
    mr.appendChild(mkOp('='));

    var rw=document.createElement('div');
    rw.style.cssText='display:flex;flex-direction:column;align-items:center;gap:4px;';
    var rs=document.createElement('div');
    rs.id='cm-result';
    rs.style.cssText='width:76px;height:76px;border-radius:50%;border:4px solid #ddd;background:#f0f0f0;';
    var rl=document.createElement('div');
    rl.style.cssText='font-size:0.85em;color:#bbb;';
    rl.textContent='Result';
    rw.appendChild(rs);rw.appendChild(rl);
    mr.appendChild(rw);
    root.appendChild(mr);

    var pal=document.createElement('div');
    pal.style.cssText='display:flex;justify-content:center;gap:10px;flex-wrap:wrap;flex-shrink:0;';
    cfg.palette.forEach(function(c){
      var sw=document.createElement('div');
      sw.id='cm-sw-'+c;
      sw.style.cssText='width:60px;height:60px;border-radius:50%;background:'+hex(c)+';cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.15);transition:transform 0.15s;outline-offset:3px;';
      sw.addEventListener('click',function(){handleSwatch(c);});
      pal.appendChild(sw);
    });
    root.appendChild(pal);
  }

  target=pickTarget();buildUI();
}
