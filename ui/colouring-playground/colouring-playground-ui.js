import Dictionary from '../../core/dictionary/dictionary-core.js';
import { loadColouringPictures } from '../../core/dictionary/dictionary-helpers-core.js';
import { buildFilterBar } from '../../components/filter-bar/filter-bar-ui.js';
import { createPaginator } from '../../components/pagination/paginator-ui.js';
import { makeSpeakable } from '../../components/speech/speakable.js';
import { mixHex, baseOf, BASE_COLOURS as BASE } from '../../core/colouring-playground/colouring-playground-core.js';

export function initColouringPlayground() {
  var mode='magic',selectedColour=null,mixA=null,mixB=null,refVisible=true;
  var currentPic=null,paginator,filled=0,total=0,popBase=null;
  var shadePop=document.getElementById('shade-pop');

  function setActive(c) {
    selectedColour=c;
    var cur=document.getElementById('cur-colour');
    cur.style.background=c||'#e0e0e0';
    cur.style.outline=c?'4px solid #2ECC71':'none';
    cur.style.outlineOffset='2px';
    var fam=baseOf(c)||c;
    document.querySelectorAll('#base-palette .swatch').forEach(function(sw){
      sw.classList.toggle('sel',sw.dataset.base===fam);
    });
    document.querySelectorAll('#guided-pal .swatch').forEach(function(sw){
      sw.classList.toggle('sel',sw.dataset.colour===c);
    });
    if(popBase){
      document.getElementById('sh-light').classList.toggle('active-shade',popBase.light===c);
      document.getElementById('sh-base').classList.toggle('active-shade',popBase.base===c);
      document.getElementById('sh-dark').classList.toggle('active-shade',popBase.dark===c);
    }
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

  function updateMix(){
    var el=document.getElementById('mix-result');
    if(mixA&&mixB){
      var c=mixHex(mixA,mixB);
      el.style.background=c;el.classList.add('filled');el.dataset.c=c;
    } else {
      el.style.background='#f5f5f5';el.classList.remove('filled');el.dataset.c='';
    }
  }

  function applyLayout(){
    var isNotMagic=mode!=='magic';
    document.getElementById('ref-panel').style.display=isNotMagic?'':'none';
    document.getElementById('palette-panel').style.display=isNotMagic?'':'none';
    document.getElementById('guided-pal').style.display=mode==='guided'?'':'none';
    document.getElementById('free-pal').style.display=mode==='free'?'':'none';
  }

  function buildGuidedPal(pic){
    var gp=document.getElementById('guided-pal');
    gp.innerHTML='';
    var seen={},cols=[];
    pic.shapes.filter(function(s){return !s.noColour;}).forEach(function(s){
      if(!seen[s.colour]){seen[s.colour]=1;cols.push(s.colour);}
    });
    cols.forEach(function(c){
      var d=document.createElement('div');
      d.className='swatch';d.style.background=c;d.dataset.colour=c;
      d.addEventListener('click',function(){setActive(c);});
      gp.appendChild(d);
    });
  }

  function buildBasePalette(){
    var bp=document.getElementById('base-palette');
    bp.innerHTML='';
    BASE.forEach(function(bc){
      var d=document.createElement('div');
      d.className='swatch';d.style.background=bc.base;d.dataset.base=bc.base;d.title=bc.name;
      d.addEventListener('click',function(e){
        e.stopPropagation();
        if(shadePop.classList.contains('open')&&popBase===bc)closePop();
        else openPop(bc,d);
      });
      bp.appendChild(d);
    });
  }

  function renderRef(pic){
    var ref=document.getElementById('ref-svg');
    ref.innerHTML='';ref.setAttribute('viewBox',pic.vb);
    pic.shapes.forEach(function(s){
      var attrs=Object.assign({},{fill:s.colour||'#eee',stroke:'#333','stroke-width':'4','stroke-linejoin':'round','stroke-linecap':'round'},s.attrs);
      ref.appendChild(ns(s.tag,attrs));
    });
    ref.style.display=refVisible?'':'none';
  }

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
    pic.shapes.forEach(function(s){
      var attrs=Object.assign({},{fill:'url(#dots)',stroke:'#333','stroke-width':'4','stroke-linejoin':'round','stroke-linecap':'round'},s.attrs);
      var el=ns(s.tag,attrs);
      if(s.noColour){
        svg.appendChild(el);
      } else {
        el.style.cursor='pointer';
        el.addEventListener('click',function(){
          if(mode==='magic'){
            el.setAttribute('fill',s.colour);filled++;
            if(filled===total)showBanner(function(){paginator.next();});
          } else if(selectedColour){
            el.setAttribute('fill',selectedColour);
          }
        });
        svg.appendChild(el);
      }
    });
    renderRef(pic);
    if(mode==='guided')buildGuidedPal(pic);
    applyLayout();
    setActive(selectedColour);
  }

  ['sh-light','sh-base','sh-dark'].forEach(function(id,i){
    document.getElementById(id).addEventListener('click',function(e){
      e.stopPropagation();
      if(popBase)setActive([popBase.light,popBase.base,popBase.dark][i]);
      closePop();
    });
  });

  document.addEventListener('click',function(e){
    if(!shadePop.contains(e.target)&&!e.target.closest('#base-palette'))closePop();
  });

  document.getElementById('mix-a').addEventListener('click',function(){
    if(selectedColour){mixA=selectedColour;this.style.background=mixA;this.classList.add('filled');updateMix();}
  });
  document.getElementById('mix-b').addEventListener('click',function(){
    if(selectedColour){mixB=selectedColour;this.style.background=mixB;this.classList.add('filled');updateMix();}
  });
  document.getElementById('mix-result').addEventListener('click',function(){if(this.dataset.c)setActive(this.dataset.c);});

  document.getElementById('ref-toggle').addEventListener('click',function(){
    refVisible=!refVisible;
    document.getElementById('ref-svg').style.display=refVisible?'':'none';
    this.textContent=refVisible?'Hide':'Show';
  });

  document.querySelectorAll('.mode-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      document.querySelectorAll('.mode-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      mode=btn.dataset.mode;
      selectedColour=null;
      if(currentPic)renderPicture(currentPic);
    });
  });

  buildBasePalette();
  applyLayout();

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
