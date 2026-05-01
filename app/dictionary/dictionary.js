var Dictionary=(function(){
  var cache={};
  var base='';

  function init(basePath){base=basePath;}

  function fetchText(url){return fetch(url).then(function(r){if(!r.ok)throw new Error(r.status);return r.text();});}
  function fetchJSON(url){return fetch(url).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});}

  function loadEntry(id){
    if(cache[id])return Promise.resolve(cache[id]);
    return fetchJSON(base+'entries/'+id+'.json').then(function(entry){
      return fetchText(base+entry.src).then(function(svgText){
        var item={
          id:entry.id,
          name:entry.meta.name,
          phonetic:entry.meta.phonetic,
          tags:entry.meta.tags,
          viewBox:entry.viewBox,
          svg:svgText,
          colouring:entry.colouring||null,
          puzzle:entry.puzzle||null,
          connectDots:entry.connectDots||null,
          freeDots:entry.freeDots||null,
          tracing:entry.tracing||null
        };
        cache[id]=item;
        return item;
      });
    });
  }

  function loadAll(){
    return fetchJSON(base+'entries/manifest.json').then(function(ids){
      return Promise.all(ids.map(loadEntry));
    });
  }

  return{init:init,loadAll:loadAll,loadEntry:loadEntry};
})();
