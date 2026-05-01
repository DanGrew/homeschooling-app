var CM_COLOURS={
  red:            {hex:'#E74C3C',label:'Red'},
  yellow:         {hex:'#F1C40F',label:'Yellow'},
  blue:           {hex:'#3498DB',label:'Blue'},
  orange:         {hex:'#E67E22',label:'Orange'},
  green:          {hex:'#2ECC71',label:'Green'},
  purple:         {hex:'#9B59B6',label:'Purple'},
  'red-orange':   {hex:'#E8562A',label:'Red-Orange'},
  'yellow-orange':{hex:'#F4A228',label:'Yellow-Orange'},
  'yellow-green': {hex:'#95C23C',label:'Yellow-Green'},
  'blue-green':   {hex:'#1AAD8E',label:'Blue-Green'},
  'blue-purple':  {hex:'#6A64B8',label:'Blue-Purple'},
  'red-purple':   {hex:'#C03890',label:'Red-Purple'},
  'red-green-mix':    {hex:'#6B5030',label:'Brown'},
  'yellow-purple-mix':{hex:'#7A6A30',label:'Brown'},
  'blue-orange-mix':  {hex:'#5A5A50',label:'Grey'},
  'orange-green-mix': {hex:'#7A7A25',label:'Olive'},
  'orange-purple-mix':{hex:'#7A3A20',label:'Brown'},
  'green-purple-mix': {hex:'#3A5A50',label:'Dark Green'}
};

var CM_MIXES={
  'red+yellow':'orange',              'yellow+red':'orange',
  'red+blue':'purple',                'blue+red':'purple',
  'blue+yellow':'green',              'yellow+blue':'green',
  'red+orange':'red-orange',          'orange+red':'red-orange',
  'yellow+orange':'yellow-orange',    'orange+yellow':'yellow-orange',
  'yellow+green':'yellow-green',      'green+yellow':'yellow-green',
  'blue+green':'blue-green',          'green+blue':'blue-green',
  'blue+purple':'blue-purple',        'purple+blue':'blue-purple',
  'red+purple':'red-purple',          'purple+red':'red-purple',
  'red+green':'red-green-mix',        'green+red':'red-green-mix',
  'yellow+purple':'yellow-purple-mix','purple+yellow':'yellow-purple-mix',
  'blue+orange':'blue-orange-mix',    'orange+blue':'blue-orange-mix',
  'orange+green':'orange-green-mix',  'green+orange':'orange-green-mix',
  'orange+purple':'orange-purple-mix','purple+orange':'orange-purple-mix',
  'green+purple':'green-purple-mix',  'purple+green':'green-purple-mix'
};

(function(){
  var cfg=window.CM_CONFIG;
  var slotA=null,slotB=null,sel=null,target=null;

  function mix(a,b){if(a===b)return a;return CM_MIXES[a+'+'+b]||null;}
  function hex(id){return CM_COLOURS[id]?CM_COLOURS[id].hex:'#f0f0f0';}
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
      var s=el(id);if(s){s.style.outline='none';}
    });
    var r=el('cm-result');
    if(r){r.style.background='#f0f0f0';r.style.outline='none';}
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
    var outlineVal=correct?'4px solid #27AE60':'4px solid #E74C3C';
    el('cm-slot-a').style.outline=outlineVal;
    el('cm-slot-a').style.outlineOffset='3px';
    el('cm-slot-b').style.outline=outlineVal;
    el('cm-slot-b').style.outlineOffset='3px';
    r.style.outline=correct?'4px solid #27AE60':'none';
    r.style.outlineOffset='3px';
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

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){target=pickTarget();buildUI();});
  } else {
    target=pickTarget();buildUI();
  }
})();
