(function(){
  var bar=document.querySelector('.nav-bar');
  if(!bar)return;

  function navLabel(text){
    var s=document.createElement('span');
    s.setAttribute('data-nav-label','');
    s.textContent=text;
    s.style.cssText='font-size:0.6em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    return s;
  }

  function makeNavBtn(tag,attrs,iconHtml,label){
    var el=document.createElement(tag);
    Object.keys(attrs).forEach(function(k){el[k]=attrs[k];});
    el.className='nav-btn';
    var icon=document.createElement('span');
    icon.innerHTML=iconHtml;
    el.appendChild(icon);
    el.appendChild(navLabel(label));
    return el;
  }

  function fixedPopout(minWidth){
    var d=document.createElement('div');
    d.style.cssText='display:none;position:fixed;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.15);min-width:'+minWidth+'px;overflow:hidden;z-index:9600;';
    document.body.appendChild(d);
    return d;
  }

  function positionPopout(popout,btn){
    var r=btn.getBoundingClientRect();
    popout.style.left=(r.right+8)+'px';
    popout.style.maxHeight='';
    popout.style.overflowY='';
    popout.style.top='';
    popout.style.bottom='';
    popout.style.visibility='hidden';
    popout.style.display='block';
    var h=popout.offsetHeight;
    popout.style.display='none';
    popout.style.visibility='';
    var spaceBelow=window.innerHeight-r.top-8;
    var spaceAbove=r.bottom-8;
    if(h<=spaceBelow){
      popout.style.top=r.top+'px';
    } else if(h<=spaceAbove){
      popout.style.bottom=(window.innerHeight-r.bottom)+'px';
    } else {
      popout.style.top=r.top+'px';
      popout.style.maxHeight=spaceBelow+'px';
      popout.style.overflowY='auto';
    }
  }

  function togglePopout(popout,btn){
    if(popout.style.display==='block'){
      popout.style.display='none';
    } else {
      positionPopout(popout,btn);
      popout.style.display='block';
    }
  }

  document.addEventListener('click',function(){
    document.querySelectorAll('.nav-links-popout,.nav-custom-popout').forEach(function(p){p.style.display='none';});
  });

  window.__buildNavPopout=function(iconHtml,label,minWidth,items,onSelect){
    var container=document.createElement('div');
    container.className='nav-btn-container';
    var btn=makeNavBtn('button',{},iconHtml,label);
    var popout=fixedPopout(minWidth);
    popout.className='nav-custom-popout';
    items.forEach(function(text,i){
      var item=document.createElement('button');
      item.textContent=text;
      item.style.cssText='display:block;width:100%;padding:12px 16px;text-align:left;border:none;background:none;cursor:pointer;font-size:0.9em;font-weight:600;color:#333;white-space:nowrap;'+(i>0?'border-top:1px solid #f0f0f0;':'');
      item.addEventListener('click',function(e){
        e.stopPropagation();
        popout.style.display='none';
        onSelect(i);
      });
      popout.appendChild(item);
    });
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      togglePopout(popout,btn);
    });
    window.addEventListener('load',function(){
      if(typeof window.__makeSpeakable==='function'){
        window.__makeSpeakable(btn,label);
        popout.querySelectorAll('button').forEach(function(item){
          window.__makeSpeakable(item,function(){return item.textContent;});
        });
      }
    });
    if(document.readyState==='complete'&&typeof window.__makeSpeakable==='function'){
      window.__makeSpeakable(btn,label);
      popout.querySelectorAll('button').forEach(function(item){
        window.__makeSpeakable(item,function(){return item.textContent;});
      });
    }
    container.appendChild(btn);
    return container;
  };

  var homeBtn=makeNavBtn('a',{href:bar.dataset.home||'index.html'},'&#127968;','Home');
  bar.insertAdjacentElement('afterbegin',homeBtn);
  window.addEventListener('load',function(){
    if(typeof window.__makeSpeakable==='function') window.__makeSpeakable(homeBtn,'Home');
  });

  var filterSlot=document.createElement('div');
  filterSlot.id='nav-filter-slot';
  filterSlot.style.cssText='display:flex;flex-direction:column;gap:4px;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;width:100%;box-sizing:border-box;padding-top:4px;align-items:center;';
  bar.appendChild(filterSlot);

  var gameArea=document.querySelector('.game-area');
  if(gameArea){
    var titleEl=document.createElement('div');
    titleEl.className='activity-title';
    titleEl.textContent=bar.dataset.title||'';
    var instrEl=document.createElement('div');
    instrEl.id=bar.dataset.instructionId||'';
    instrEl.className='activity-instruction';
    instrEl.textContent=bar.dataset.instruction||'';
    var header=document.createElement('div');
    header.className='activity-header';
    header.appendChild(titleEl);
    header.appendChild(instrEl);
    gameArea.insertAdjacentElement('afterbegin',header);
    window.addEventListener('load',function(){
      [titleEl,instrEl].forEach(function(el){
        if(typeof window.__makeSpeakable==='function'){
          window.__makeSpeakable(el,function(){return el.textContent;});
        } else {
          el.addEventListener('click',function(){
            if(el.textContent&&typeof window.__speak==='function'){window.__speak(el.textContent);}
          });
        }
      });
    });
  }

  if(bar.dataset.links){
    var links=JSON.parse(bar.dataset.links);
    var isLesson=bar.dataset.linksIcon==='lesson';
    var linksIconHtml=isLesson?'&#128218;':'&#127918;';
    var linksLabel=isLesson?'Lessons':'Games';
    var lnkContainer=document.createElement('div');
    lnkContainer.className='nav-btn-container';
    if(links.length===1){
      var directBtn=makeNavBtn('a',{href:links[0].href},linksIconHtml,linksLabel);
      window.addEventListener('load',function(){
        if(typeof window.__makeSpeakable==='function') window.__makeSpeakable(directBtn,linksLabel);
      });
      lnkContainer.appendChild(directBtn);
    } else {
      var lnkBtn=makeNavBtn('button',{},linksIconHtml,linksLabel);
      var lnkPopout=fixedPopout(160);
      lnkPopout.className='nav-links-popout';
      links.forEach(function(l,i){
        var item=document.createElement('a');
        item.href=l.href;
        item.textContent=l.label;
        item.style.cssText='display:block;padding:12px 16px;text-decoration:none;font-size:0.9em;font-weight:600;color:#333;white-space:nowrap;'+(i>0?'border-top:1px solid #f0f0f0;':'');
        lnkPopout.appendChild(item);
      });
      lnkBtn.addEventListener('click',function(e){
        e.stopPropagation();
        togglePopout(lnkPopout,lnkBtn);
      });
      window.addEventListener('load',function(){
        if(typeof window.__makeSpeakable==='function'){
          window.__makeSpeakable(lnkBtn,linksLabel);
        }
      });
      lnkContainer.appendChild(lnkBtn);
    }
    bar.appendChild(lnkContainer);
  }

  var navExpanded=false;
  var expandBtn=document.createElement('button');
  expandBtn.innerHTML='\u00BB';
  expandBtn.className='nav-btn';
  expandBtn.style.cssText='flex-shrink:0;font-size:1em;';
  expandBtn.addEventListener('click',function(e){
    e.stopPropagation();
    navExpanded=!navExpanded;
    bar.classList.toggle('expanded',navExpanded);
    expandBtn.innerHTML=navExpanded?'\u00AB':'\u00BB';
    window.dispatchEvent(new CustomEvent('nav:expand',{detail:{expanded:navExpanded}}));
  });
  window.addEventListener('load',function(){
    if(typeof window.__makeSpeakable==='function'){
      window.__makeSpeakable(expandBtn,function(){return navExpanded?'Open':'Close';});
    }
  });
  bar.appendChild(expandBtn);

  document.addEventListener('touchstart',function(e){if(e.touches.length>=3)e.preventDefault();},{passive:false});
})();
