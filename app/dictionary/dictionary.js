var Dictionary=(function(){
  var base='';
  var conceptCache={};
  var repCache={};

  function init(basePath){base=basePath;}

  function fetchJSON(url){return fetch(url).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});}
  function fetchText(url){return fetch(url).then(function(r){if(!r.ok)throw new Error(r.status);return r.text();});}

  function loadConcept(id){
    if(conceptCache[id])return Promise.resolve(conceptCache[id]);
    return fetchJSON(base+'entries/'+id+'/concept.json').then(function(c){
      conceptCache[id]=c;
      return c;
    });
  }

  function loadRep(repPath){
    if(repCache[repPath])return Promise.resolve(repCache[repPath]);
    return fetchJSON(base+repPath).then(function(rep){
      return loadConcept(rep.concept).then(function(concept){
        var item=Object.assign({},concept,rep);
        delete item.concept;
        if(rep.src){
          return fetchText(base+rep.src).then(function(svg){
            item.svg=svg;
            repCache[repPath]=item;
            return item;
          });
        }
        repCache[repPath]=item;
        return item;
      });
    });
  }

  function loadManifest(type,level){
    var manifestPath=base+'manifests/'+type+'-level-'+level+'.json';
    return fetchJSON(manifestPath).then(function(paths){
      return Promise.all(paths.map(function(p){return loadRep(p);}));
    });
  }

  return{init:init,loadManifest:loadManifest};
})();

if(typeof module!=='undefined')module.exports=Dictionary;
