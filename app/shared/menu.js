(function(){
  var bar=document.querySelector('.nav-bar');
  if(!bar)return;
  var h='<a href="'+(bar.dataset.home||'index.html')+'" class="nav-btn">&#127968;</a>';
  if(bar.dataset.title)h+='<span class="nav-title">'+bar.dataset.title+'</span>';
  if(bar.dataset.prev)h+='<button onclick="'+bar.dataset.prev+'()" class="nav-btn">&#8593;</button>';
  if(bar.dataset.next)h+='<button onclick="'+bar.dataset.next+'()" class="nav-btn">&#8595;</button>';
  if(bar.dataset.links){var g='<div class="nav-links">';JSON.parse(bar.dataset.links).forEach(function(l){g+='<a href="'+l.href+'" class="nav-btn nav-link">'+l.label+'</a>';});h+=g+'</div>';}
  if(window.LESSONS&&window.LESSONS.length){var lg='<div style="display:flex;gap:6px;align-items:center;margin-left:4px;">';window.LESSONS.forEach(function(l){lg+='<button class="nav-lesson-btn" data-lesson-id="'+l.id+'" title="'+l.title+'" style="width:32px;height:32px;border-radius:50%;border:2px solid #2563EB;color:#2563EB;background:transparent;font-weight:700;font-size:0.9em;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+l.number+'</button>';});h+=lg+'</div>';}
  bar.insertAdjacentHTML('afterbegin',h);
  document.querySelectorAll('.nav-lesson-btn').forEach(function(btn){btn.addEventListener('click',function(){var id=btn.dataset.lessonId;var lesson=(window.LESSON_MAP||{})[id];if(lesson&&window.guidanceService)window.guidanceService.start(lesson);});});
  document.addEventListener('touchstart',function(e){if(e.touches.length>=3)e.preventDefault();},{passive:false});
})();
