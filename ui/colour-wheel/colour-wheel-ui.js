import { makeSpeakable, makeInteractive } from '../../components/speech/speakable.js';
import { speak } from '../../components/speech/speech-ui.js';
import { w2r, pieSeg, annulusSeg, hex, lsnMix } from '../../core/colour-wheel/colour-wheel-core.js';

var LSN_COLOURS={
  red:            {hex:'#E74C3C',label:'Red'},
  yellow:         {hex:'#F1C40F',label:'Yellow'},
  blue:           {hex:'#3498DB',label:'Blue'},
  orange:         {hex:'#E67E22',label:'Orange'},
  green:          {hex:'#2ECC71',label:'Green'},
  purple:         {hex:'#9B59B6',label:'Purple'},
  'red-orange':   {hex:'#E8562A',label:'Vermillion'},
  'yellow-orange':{hex:'#F4A228',label:'Amber'},
  'yellow-green': {hex:'#95C23C',label:'Chartreuse'},
  'blue-green':   {hex:'#1AAD8E',label:'Teal'},
  'blue-purple':  {hex:'#6A64B8',label:'Indigo'},
  'red-purple':   {hex:'#C03890',label:'Magenta'},
  'red-green-mix':    {hex:'#6B5030',label:'Brown'},
  'yellow-purple-mix':{hex:'#7A6A30',label:'Brown'},
  'blue-orange-mix':  {hex:'#5A5A50',label:'Grey'},
  'orange-green-mix': {hex:'#7A7A25',label:'Olive'},
  'orange-purple-mix':{hex:'#7A3A20',label:'Brown'},
  'green-purple-mix': {hex:'#3A5A50',label:'Dark Green'}
};

var LSN_MIXES={
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

var PALETTE=['red','yellow','blue','orange','green','purple','red-orange','yellow-orange','yellow-green','blue-green','blue-purple','red-purple'];

var PRIMARIES   =[{c:'red',start:-60},{c:'yellow',start:60},{c:'blue',start:180}];
var SECONDARIES =[{c:'orange',start:0},{c:'green',start:120},{c:'purple',start:240}];
var TERTIARIES  =[
  {c:'red-orange',start:0},{c:'yellow-orange',start:60},{c:'yellow-green',start:120},
  {c:'blue-green',start:180},{c:'blue-purple',start:240},{c:'red-purple',start:300}
];

var slotA=null,slotB=null,sel=null;
var _slotALocked=false,_slotBLocked=false;

function el(id){return document.getElementById(id);}

var SWATCH_STATE={
  'true': function(sw){sw.style.borderColor='#333';sw.style.transform='scale(1.12)';},
  'false':function(sw){sw.style.borderColor='transparent';sw.style.transform='scale(1)';}
};

function renderPalette(){
  PALETTE.forEach(function(c){SWATCH_STATE[String(sel===c)](el('lsn-sw-'+c));});
}

function handleSwatch(c){sel=c;renderPalette();}

var SLOT_ASSIGN={
  'a':function(){slotA=sel;},
  'b':function(){slotB=sel;}
};

var SLOT_GET={'a':function(){return slotA;},'b':function(){return slotB;}};

// arch: allow-pure-fn
function slotEvent(slot,colour){return colour.replace(/-/g,'_').toUpperCase()+'_LOADED_'+slot.toUpperCase();}

function getMixResult(){
  return [slotA,slotB].filter(Boolean)
    .filter(function(_,i,a){return a.length===2;})
    .map(function(){return lsnMix(slotA,slotB,LSN_MIXES);})
    .map(function(m){return LSN_COLOURS[m];})
    .filter(Boolean)[0];
}

function updateResult(){
  var col=getMixResult();
  el('lsn-result').style.background=[col].filter(Boolean).map(function(c){return c.hex;}).concat(['#f0f0f0'])[0];
  el('lsn-result-label').textContent=[col].filter(Boolean).map(function(c){return c.label;}).concat(['Result'])[0];
}

function doSlot(slot){
  SLOT_ASSIGN[slot]();
  sel=null;
  el('lsn-slot-a').style.background=[slotA].filter(Boolean).map(function(c){return hex(c,LSN_COLOURS);}).concat(['#f0f0f0'])[0];
  el('lsn-slot-b').style.background=[slotB].filter(Boolean).map(function(c){return hex(c,LSN_COLOURS);}).concat(['#f0f0f0'])[0];
  renderPalette();
  updateResult();
  [SLOT_GET[slot]()].filter(Boolean).forEach(function(c){window.dispatchEvent(new CustomEvent('guidance:event',{detail:{type:slotEvent(slot,c)}}));});
}

var SLOT_LOCKED={'a':function(){return _slotALocked;},'b':function(){return _slotBLocked;}};
function handleSlot(slot){
  [sel].filter(Boolean).filter(function(){return !SLOT_LOCKED[slot]();}).forEach(function(){doSlot(slot);});
}

(function buildWheel(){
  var svg=el('wheel-svg');
  var cx=150,cy=150;
  var rPi=55,rSiIn=60,rSiOut=100,rToIn=105,rToOut=140;
  var gap=1.5;
  var NS='http://www.w3.org/2000/svg';
  function addPath(d,fill,colourId){
    var p=document.createElementNS(NS,'path');
    p.setAttribute('d',d);p.setAttribute('fill',fill);
    p.style.cursor='pointer';
    svg.appendChild(p);
    [colourId].filter(Boolean).forEach(function(id){
      makeSpeakable(p,LSN_COLOURS[id].label);
      p.addEventListener('click',function(){
        window.dispatchEvent(new CustomEvent('guidance:event',{detail:{type:id.replace(/-/g,'_').toUpperCase()+'_TAPPED'}}));
      });
    });
  }
  PRIMARIES.forEach(function(s){addPath(pieSeg(cx,cy,rPi,s.start,s.start+120,gap),hex(s.c,LSN_COLOURS),s.c);});
  SECONDARIES.forEach(function(s){addPath(annulusSeg(cx,cy,rSiOut,rSiIn,s.start,s.start+120,gap),hex(s.c,LSN_COLOURS),s.c);});
  TERTIARIES.forEach(function(s){addPath(annulusSeg(cx,cy,rToOut,rToIn,s.start,s.start+60,gap),hex(s.c,LSN_COLOURS),s.c);});
  var cc=document.createElementNS('http://www.w3.org/2000/svg','circle');
  cc.setAttribute('cx','150');cc.setAttribute('cy','150');cc.setAttribute('r','16');
  cc.setAttribute('fill','#fff8f0');
  svg.appendChild(cc);
})();

(function buildPalette(){
  var pal=el('lsn-palette');
  PALETTE.forEach(function(c){
    var sw=document.createElement('div');
    sw.id='lsn-sw-'+c;
    sw.style.cssText='width:56px;height:56px;border-radius:50%;background:'+hex(c,LSN_COLOURS)+';cursor:pointer;border:4px solid transparent;transition:transform 0.1s;';
    makeInteractive(sw,function(){
      handleSwatch(c);
      speak(LSN_COLOURS[c].label);
      window.dispatchEvent(new CustomEvent('guidance:event',{detail:{type:c.replace(/-/g,'_').toUpperCase()+'_TAPPED'}}));
    });
    pal.appendChild(sw);
  });
})();

el('lsn-slot-a').addEventListener('click',function(){handleSlot('a');});
el('lsn-slot-b').addEventListener('click',function(){handleSlot('b');});
makeInteractive(el('lsn-result'),function(){[getMixResult()].filter(Boolean).forEach(function(c){speak(c.label);});});

window.addEventListener('page:control',function(e){
  ({
    'HIDE_COLOUR_WHEEL':function(){var c=el('wheel-svg').parentElement;if(c)c.style.display='none';},
    'HIDE_MIXER':function(){var m=el('lsn-mixer');if(m)m.style.display='none';},
    'LOCK_SLOT_A':function(){_slotALocked=true;},
    'LOCK_SLOT_B':function(){_slotBLocked=true;},
    'PAGE_CONTROL_RESET':function(){
      var c=el('wheel-svg').parentElement;if(c)c.style.display='';
      var m=el('lsn-mixer');if(m)m.style.display='';
      _slotALocked=false;_slotBLocked=false;
    }
  }[e.detail.type]||function(){})();
});
