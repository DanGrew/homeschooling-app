(function(){
  var bar=document.querySelector('.nav-bar');
  if(!bar)return;
  var h='<a href="'+(bar.dataset.home||'index.html')+'" class="nav-btn">&#127968;</a>';
  if(bar.dataset.title)h+='<span class="nav-title">'+bar.dataset.title+'</span>';
  if(bar.dataset.prev)h+='<button onclick="'+bar.dataset.prev+'()" class="nav-btn">&#8593;</button>';
  if(bar.dataset.next)h+='<button onclick="'+bar.dataset.next+'()" class="nav-btn">&#8595;</button>';
  if(bar.dataset.links){var g='<div class="nav-links">';JSON.parse(bar.dataset.links).forEach(function(l){g+='<a href="'+l.href+'" class="nav-btn nav-link">'+l.label+'</a>';});h+=g+'</div>';}
  bar.insertAdjacentHTML('afterbegin',h);

  var POPOUT_TOGGLE={'':'none','none':''};
  var VERT_POS={
    'true': {top:'calc(100% + 8px)',bottom:''},
    'false':{top:'',bottom:'calc(100% + 8px)'}
  };
  var HORIZ_POS={
    'true': {left:'0',right:''},
    'false':{left:'',right:'0'}
  };

  if(window.LESSONS&&window.LESSONS.length){
    var wrap=document.createElement('div');
    wrap.style.cssText='display:flex;gap:6px;align-items:center;margin-left:4px;';
    window.LESSONS.forEach(function(l){
      var container=document.createElement('div');
      container.style.cssText='position:relative;';

      var btn=document.createElement('button');
      btn.innerHTML='&#128218;';
      btn.className='nav-lesson-btn';
      btn.style.cssText='width:32px;height:32px;border-radius:50%;border:2px solid #2563EB;color:#2563EB;background:transparent;font-size:1.1em;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;';

      var popout=document.createElement('div');
      popout.className='nav-lesson-popout';
      popout.style.cssText='display:none;position:absolute;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.15);min-width:190px;overflow:hidden;z-index:9600;';

      var item=document.createElement('button');
      item.textContent='Lesson '+l.number+': '+l.title;
      item.className='nav-lesson-item';
      item.style.cssText='display:block;width:100%;padding:12px 16px;text-align:left;border:none;background:none;cursor:pointer;font-size:0.9em;font-weight:600;color:#333;white-space:nowrap;';

      btn.addEventListener('click',function(e){
        e.stopPropagation();
        var r=btn.getBoundingClientRect();
        var vert=VERT_POS[String(r.top<window.innerHeight/2)];
        var horiz=HORIZ_POS[String(r.left<window.innerWidth/2)];
        popout.style.top=vert.top;popout.style.bottom=vert.bottom;
        popout.style.left=horiz.left;popout.style.right=horiz.right;
        popout.style.display=POPOUT_TOGGLE[popout.style.display];
      });

      item.addEventListener('click',function(e){
        e.stopPropagation();
        popout.style.display='none';
        [window.guidanceService].filter(Boolean).forEach(function(svc){
          [(window.LESSON_MAP||{})[l.id]].filter(Boolean).forEach(function(lesson){
            svc.start(lesson);
          });
        });
      });

      popout.appendChild(item);
      container.appendChild(btn);
      container.appendChild(popout);
      wrap.appendChild(container);
    });
    document.addEventListener('click',function(){
      document.querySelectorAll('.nav-lesson-popout').forEach(function(p){p.style.display='none';});
    });
    bar.appendChild(wrap);
  }

  document.addEventListener('touchstart',function(e){if(e.touches.length>=3)e.preventDefault();},{passive:false});
})();
