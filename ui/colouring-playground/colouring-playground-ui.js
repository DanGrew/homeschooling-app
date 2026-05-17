import Dictionary from '../../core/dictionary/dictionary-core.js';
import { loadColouringPictures } from '../../core/dictionary/dictionary-helpers-core.js';
import { buildFilterBar } from '../../components/filter-bar/filter-bar-ui.js';
import { createPaginator } from '../../components/pagination/paginator-ui.js';
import { makeSpeakable } from '../../components/speech/speakable.js';
import { mixHex, baseOf, BASE_COLOURS as BASE } from '../../core/colouring-playground/colouring-playground-core.js';

var LAYOUT = {
  magic:  {ref:'none', palette:'none', guided:'none', free:'none'},
  guided: {ref:'',     palette:'',     guided:'',     free:'none'},
  free:   {ref:'',     palette:'',     guided:'none', free:''}
};
var DISPLAY = {true:'', false:'none'};
var REF_LABEL = {true:'Hide', false:'Show'};
var ACTIVE_OUTLINE = {true:'4px solid #2ECC71', false:'none'};

export function initColouringPlayground() {
  var mode='magic',selectedColour=null,mixA=null,mixB=null,refVisible=true;
  var currentPic=null,paginator,filled=0,total=0,popBase=null;
  var shadePop=document.getElementById('shade-pop');
  var refToggleEl=document.getElementById('ref-toggle');
  makeSpeakable(refToggleEl,function(){return refToggleEl.textContent;});
  makeSpeakable(document.getElementById('ref-label'),'Reference');
  var mixAEl=document.getElementById('mix-a');
  var mixBEl=document.getElementById('mix-b');
  var mixResultEl=document.getElementById('mix-result');

  function setActive(c) {
    selectedColour=c;
    var cur=document.getElementById('cur-colour');
    cur.style.background=[c,'#e0e0e0'].find(Boolean);
    cur.style.outline=ACTIVE_OUTLINE[String(!!c)];
    cur.style.outlineOffset='2px';
    var fam=[baseOf(c),c].find(Boolean);
    document.querySelectorAll('#base-palette .swatch').forEach(function(sw){
      sw.classList.toggle('sel',sw.dataset.base===fam);
    });
    document.querySelectorAll('#guided-pal .swatch').forEach(function(sw){
      sw.classList.toggle('sel',sw.dataset.colour===c);
    });
    [popBase].filter(Boolean).forEach(function(pb){
      document.getElementById('sh-light').classList.toggle('active-shade',pb.light===c);
      document.getElementById('sh-base').classList.toggle('active-shade',pb.base===c);
      document.getElementById('sh-dark').classList.toggle('active-shade',pb.dark===c);
    });
  }

  function closePop(){shadePop.classList.remove('open');popBase=null;}

  function openPop(bc,swatchEl){
    popBase=bc;
    document.getElementById('sh-light').style.background=bc.light;
    document.getElementById('sh-base').style.background=bc.base;
    document.getElementById('sh-dark').style.background=bc.dark;
    document.getElementById('sh-light').classList.toggle('active-shade',bc.light===selectedColour);
    document.getElementById('sh-base').classList.toggle('active-shade',bc.base===selectedColour);
    document.getElementById('sh-dark').classList.toggle('active-shade',bc.dark===selectedColour);
    var r=swatchEl.getBoundingClientRect(),popW=3*48+2*6+16+4;
    shadePop.style.left=Math.max(4,Math.min(window.innerWidth-popW-4,r.left+r.width/2-popW/2))+'px';
    shadePop.style.top=Math.max(4,r.top-72)+'px';
    shadePop.classList.add('open');
  }

  function bothMixSet(){return[mixA,mixB].every(Boolean);}

  function applyMixResult(c){
    mixResultEl.style.background=c;
    mixResultEl.classList.add('filled');
    mixResultEl.dataset.c=c;
  }

  function clearMixResult(){
    mixResultEl.style.background='#f5f5f5';
    mixResultEl.classList.remove('filled');
    mixResultEl.dataset.c='';
  }

  var MIX_UPDATE={
    true:function(){applyMixResult(mixHex(mixA,mixB));},
    false:clearMixResult
  };

  function updateMix(){MIX_UPDATE[String(bothMixSet())]();}

  function applyLayout(){
    var l=LAYOUT[mode];
    document.getElementById('ref-panel').style.display=l.ref;
    document.getElementById('palette-panel').style.display=l.palette;
    document.getElementById('guided-pal').style.display=l.guided;
    document.getElementById('free-pal').style.display=l.free;
  }

  function buildGuidedPal(pic){
    var gp=document.getElementById('guided-pal');
    gp.innerHTML='';
    var seen={};
    pic.shapes.filter(function(s){return !s.noColour;})
      .map(function(s){return s.colour;})
      .filter(function(c){var n=!seen[c];seen[c]=1;return n;})
      .forEach(function(c){
        var d=document.createElement('div');
        d.className='swatch';d.style.background=c;d.dataset.colour=c;
        d.addEventListener('click',function(){setActive(c);});
        gp.appendChild(d);
      });
  }

  function isPopOpenFor(bc){
    return[shadePop]
      .filter(function(s){return s.classList.contains('open');})
      .some(function(){return popBase===bc;});
  }

  var POP_TOGGLE={
    true:function(){closePop();},
    false:function(bc,d){openPop(bc,d);}
  };

  function handleSwatchClick(bc,d){POP_TOGGLE[String(isPopOpenFor(bc))](bc,d);}

  function buildBasePalette(){
    var bp=document.getElementById('base-palette');
    bp.innerHTML='';
    BASE.forEach(function(bc){
      var d=document.createElement('div');
      d.className='swatch';d.style.background=bc.base;d.dataset.base=bc.base;d.title=bc.name;
      d.addEventListener('click',function(e){
        e.stopPropagation();
        handleSwatchClick(bc,d);
      });
      bp.appendChild(d);
    });
  }

  function renderRef(pic){
    var ref=document.getElementById('ref-svg');
    ref.innerHTML='';ref.setAttribute('viewBox',pic.vb);
    pic.shapes.forEach(function(s){
      var attrs=Object.assign({},{fill:[s.colour,'#eee'].find(Boolean),stroke:'#333','stroke-width':'4','stroke-linejoin':'round','stroke-linecap':'round'},s.attrs);
      ref.appendChild(ns(s.tag,attrs));
    });
    ref.style.display=DISPLAY[String(refVisible)];
  }

  var MAGIC_ADVANCE={
    true:function(){showBanner(function(){paginator.next();});},
    false:function(){}
  };

  function magicClick(el,s){
    el.setAttribute('fill',s.colour);
    filled++;
    MAGIC_ADVANCE[String(filled===total)]();
  }

  function colourClick(el){
    [selectedColour].filter(Boolean).forEach(function(c){el.setAttribute('fill',c);});
  }

  var CLICK_HANDLER={magic:magicClick,guided:colourClick,free:colourClick};

  var ON_RENDER_MODE={guided:buildGuidedPal,free:function(){},magic:function(){}};

  function renderPicture(pic){
    currentPic=pic;closePop();filled=0;
    var titleBtn=document.getElementById('pic-title');
    titleBtn.textContent=pic.name;
    makeSpeakable(titleBtn,pic.name);
    hideBanner();
    total=pic.shapes.filter(function(s){return !s.noColour;}).length;
    var svg=document.getElementById('svg');
    svg.innerHTML='';svg.setAttribute('viewBox',pic.vb);
    injectDotPattern(svg);
    pic.shapes.filter(function(s){return s.noColour;}).forEach(function(s){
      var attrs=Object.assign({},{fill:'url(#dots)',stroke:'#333','stroke-width':'4','stroke-linejoin':'round','stroke-linecap':'round'},s.attrs);
      svg.appendChild(ns(s.tag,attrs));
    });
    pic.shapes.filter(function(s){return !s.noColour;}).forEach(function(s){
      var attrs=Object.assign({},{fill:'url(#dots)',stroke:'#333','stroke-width':'4','stroke-linejoin':'round','stroke-linecap':'round'},s.attrs);
      var el=ns(s.tag,attrs);
      el.style.cursor='pointer';
      el.addEventListener('click',function(){CLICK_HANDLER[mode](el,s);});
      svg.appendChild(el);
    });
    renderRef(pic);
    ON_RENDER_MODE[mode](pic);
    applyLayout();
    setActive(selectedColour);
  }

  ['sh-light','sh-base','sh-dark'].forEach(function(id,i){
    document.getElementById(id).addEventListener('click',function(e){
      e.stopPropagation();
      [popBase].filter(Boolean).forEach(function(pb){
        setActive([pb.light,pb.base,pb.dark][i]);
      });
      closePop();
    });
  });

  document.addEventListener('click',function(e){
    [1].filter(function(){return !shadePop.contains(e.target);})
       .filter(function(){return !e.target.closest('#base-palette');})
       .forEach(closePop);
  });

  mixAEl.addEventListener('click',function(){
    [selectedColour].filter(Boolean).forEach(function(c){
      mixA=c;mixAEl.style.background=c;mixAEl.classList.add('filled');updateMix();
    });
  });
  mixBEl.addEventListener('click',function(){
    [selectedColour].filter(Boolean).forEach(function(c){
      mixB=c;mixBEl.style.background=c;mixBEl.classList.add('filled');updateMix();
    });
  });
  mixResultEl.addEventListener('click',function(){
    [mixResultEl.dataset.c].filter(Boolean).forEach(setActive);
  });

  refToggleEl.addEventListener('click',function(){
    refVisible=!refVisible;
    document.getElementById('ref-svg').style.display=DISPLAY[String(refVisible)];
    refToggleEl.textContent=REF_LABEL[String(refVisible)];
  });

var MODES=[
    {mode:'magic',icon:'✨',label:'Magic'},
    {mode:'guided',icon:'🎯',label:'Guided'},
    {mode:'free',icon:'🎨',label:'Free'}
  ];

  var LABEL_DISPLAY={true:'',false:'none'};

  function buildModeNav(){
    var slot=document.getElementById('nav-filter-slot');
    var divider=document.createElement('div');
    divider.setAttribute('data-mode-divider','');
    divider.style.cssText='height:2px;background:#e0e0e0;width:80%;margin:4px auto;flex-shrink:0;border-radius:2px;';
    MODES.forEach(function(m){
      var b=document.createElement('button');
      b.setAttribute('data-mode-btn',m.mode);
      b.style.cssText=modeBtn(m.mode===mode);
      var icon=document.createElement('span');
      icon.textContent=m.icon;
      var lbl=document.createElement('span');
      lbl.setAttribute('data-label','');
      lbl.textContent=m.label;
      lbl.style.cssText='font-size:0.8em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:none;';
      b.appendChild(icon);b.appendChild(lbl);
      makeSpeakable(b,m.label);
      b.addEventListener('click',function(){
        mode=m.mode;selectedColour=null;
        slot.querySelectorAll('button[data-mode-btn]').forEach(function(x){
          x.style.cssText=modeBtn(x.getAttribute('data-mode-btn')===mode);
        });
        [currentPic].filter(Boolean).forEach(renderPicture);
      });
      slot.appendChild(b);
    });
    slot.appendChild(divider);
    window.addEventListener('nav:expand',function(e){
      slot.querySelectorAll('button[data-mode-btn]').forEach(function(b){
        b.querySelector('[data-label]').style.display=LABEL_DISPLAY[String(e.detail.expanded)];
      });
    });
  }

  var MODE_BTN_ACTIVE={
    true:'display:flex;flex-direction:column;align-items:center;width:100%;padding:6px 4px;border:none;border-radius:8px;cursor:pointer;gap:2px;font-size:1.1em;background:#F39C12;color:#fff;',
    false:'display:flex;flex-direction:column;align-items:center;width:100%;padding:6px 4px;border:none;border-radius:8px;cursor:pointer;gap:2px;font-size:1.1em;background:none;color:#888;'
  };

  // arch: allow-pure-fn
  function modeBtn(on){return MODE_BTN_ACTIVE[String(on)];}

  buildBasePalette();
  applyLayout();
  buildModeNav();

  paginator=createPaginator({
    container:document.getElementById('paginator-bar'),
    items:[],perPage:1,wrap:true,
    onRender:function(pic){renderPicture(pic);}
  });

  Dictionary.init('../../../content/dictionary/');
  loadColouringPictures(pictures,function(){
    buildFilterBar(pictures,function(f){paginator.reset(f);});
  },function(){document.getElementById('pic-title').textContent='⚠️ Failed to load — check connection';});
}
