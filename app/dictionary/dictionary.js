var Dictionary=(function(){
  var cache={};
  var base='';

  function init(basePath){base=basePath;}

  function fetchText(url){return fetch(url).then(function(r){if(!r.ok)throw new Error(r.status);return r.text();});}
  function fetchJSON(url){return fetch(url).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});}

  function loadEntry(id,representations){
    var cacheKey=id+'|'+(representations||[]).slice().sort().join(',');
    if(cache[cacheKey])return Promise.resolve(cache[cacheKey]);
    return fetchJSON(base+'entries/'+id+'.json').then(function(entry){
      var repKeys=representations||[];
      var repPromises=repKeys.map(function(rep){
        var path=entry.representations&&entry.representations[rep];
        if(!path)return Promise.resolve(null);
        return fetchJSON(base+path).then(function(data){return{rep:rep,data:data};});
      });
      return Promise.all([fetchText(base+entry.src),Promise.all(repPromises)]).then(function(results){
        var svgText=results[0];
        var repResults=results[1];
        var item={
          id:entry.id,
          name:entry.meta.name,
          phonetic:entry.meta.phonetic,
          tags:entry.meta.tags,
          viewBox:entry.viewBox,
          svg:svgText
        };
        repResults.forEach(function(r){if(r)item[r.rep]=r.data;});
        cache[cacheKey]=item;
        return item;
      });
    });
  }

  function loadAll(representations){
    return fetchJSON(base+'entries/manifest.json').then(function(ids){
      return Promise.all(ids.map(function(id){return loadEntry(id,representations);}));
    });
  }

  return{init:init,loadAll:loadAll,loadEntry:loadEntry};
})();
