(function(){
  var bar=document.querySelector('.nav-bar');
  if(!bar)return;

  bar.insertAdjacentHTML('afterbegin','<a href="'+(bar.dataset.home||'index.html')+'" class="nav-btn">&#127968;</a>');

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

  if(window.LESSONS&&window.LESSONS.length){
    document.body.classList.add('has-lessons');
    var lsnContainer=document.createElement('div');
    lsnContainer.style.cssText='position:relative;';
    var lsnBtn=document.createElement('button');
    lsnBtn.innerHTML='&#128218;';
    lsnBtn.className='nav-btn nav-lesson-btn';
    lsnBtn.style.cssText='flex-shrink:0;';
    var lsnPopout=document.createElement('div');
    lsnPopout.className='nav-lesson-popout';
    lsnPopout.style.cssText='display:none;position:absolute;top:0;left:calc(100% + 8px);background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.15);min-width:190px;overflow:hidden;z-index:9600;';
    window.LESSONS.forEach(function(l,i){
      var item=document.createElement('button');
      item.textContent='Lesson '+l.number+': '+l.title;
      item.className='nav-lesson-item';
      item.style.cssText='display:block;width:100%;padding:12px 16px;text-align:left;border:none;background:none;cursor:pointer;font-size:0.9em;font-weight:600;color:#333;white-space:nowrap;'+(i>0?'border-top:1px solid #f0f0f0;':'');
      item.addEventListener('click',function(e){
        e.stopPropagation();
        lsnPopout.style.display='none';
        [window.guidanceService].filter(Boolean).forEach(function(svc){
          [(window.LESSON_MAP||{})[l.id]].filter(Boolean).forEach(function(lesson){svc.start(lesson);});
        });
      });
      lsnPopout.appendChild(item);
    });
    lsnBtn.addEventListener('click',function(e){
      e.stopPropagation();
      lsnPopout.style.display=lsnPopout.style.display===''?'none':'';
    });
    document.addEventListener('click',function(){
      document.querySelectorAll('.nav-lesson-popout').forEach(function(p){p.style.display='none';});
    });
    window.addEventListener('load',function(){
      if(typeof window.__makeSpeakable==='function'){
        window.__makeSpeakable(lsnBtn,'Lessons');
        lsnPopout.querySelectorAll('.nav-lesson-item').forEach(function(item){
          window.__makeSpeakable(item,function(){return item.textContent;});
        });
      }
    });
    lsnContainer.appendChild(lsnBtn);
    lsnContainer.appendChild(lsnPopout);
    bar.appendChild(lsnContainer);
  }

  if(bar.dataset.links){
    var links=JSON.parse(bar.dataset.links);
    var linksIcon=bar.dataset.linksIcon==='lesson'?'&#128218;':'&#127918;';
    var container=document.createElement('div');
    container.style.cssText='position:relative;';
    if(links.length===1){
      var directBtn=document.createElement('a');
      directBtn.href=links[0].href;
      directBtn.innerHTML=linksIcon;
      directBtn.className='nav-btn';
      container.appendChild(directBtn);
    } else {
      var btn=document.createElement('button');
      btn.innerHTML=linksIcon;
      btn.className='nav-btn';
      var popout=document.createElement('div');
      popout.style.cssText='display:none;position:absolute;top:0;left:calc(100% + 8px);background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.15);min-width:160px;overflow:hidden;z-index:9600;';
      links.forEach(function(l,i){
        var item=document.createElement('a');
        item.href=l.href;
        item.textContent=l.label;
        item.style.cssText='display:block;padding:12px 16px;text-decoration:none;font-size:0.9em;font-weight:600;color:#333;white-space:nowrap;'+(i>0?'border-top:1px solid #f0f0f0;':'');
        popout.appendChild(item);
      });
      btn.addEventListener('click',function(e){
        e.stopPropagation();
        popout.style.display=popout.style.display===''?'none':'';
      });
      document.addEventListener('click',function(){popout.style.display='none';});
      container.appendChild(btn);
      container.appendChild(popout);
    }
    bar.appendChild(container);
  }

  document.addEventListener('touchstart',function(e){if(e.touches.length>=3)e.preventDefault();},{passive:false});
})();
