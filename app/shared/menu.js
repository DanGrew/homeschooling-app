(function(){
  var bar=document.querySelector('.nav-bar');
  if(!bar)return;
  var h='<a href="'+(bar.dataset.home||'index.html')+'" class="nav-btn">&#127968;</a>';
  if(bar.dataset.prev)h+='<button onclick="'+bar.dataset.prev+'()" class="nav-btn">&#8593;</button>';
  if(bar.dataset.next)h+='<button onclick="'+bar.dataset.next+'()" class="nav-btn">&#8595;</button>';
  bar.insertAdjacentHTML('afterbegin',h);
  document.addEventListener('touchstart',function(e){if(e.touches.length>=3)e.preventDefault();},{passive:false});
})();
