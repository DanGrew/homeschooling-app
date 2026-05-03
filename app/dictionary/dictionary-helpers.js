import Dictionary from './dictionary.js';

export function loadColouringPictures(pictures,callback){
  Dictionary.loadManifest('colouring',1).then(function(items){
    items.forEach(function(item){
      pictures.push({name:item.name,tags:item.tags,vb:item.viewBox,shapes:item.shapes});
    });
    callback();
  }).catch(function(){callback();});
}

export function loadConnectDots(shapes,callback){
  Dictionary.loadManifest('connectDots',1).then(function(items){
    items.forEach(function(item){
      shapes.push({name:item.name,tags:item.tags,vb:item.viewBox,level:item.level,dots:item.dots,guides:item.guides,decor:item.decor});
    });
    shapes.sort(function(a,b){var l=a.level-b.level;return l!==0?l:a.name.localeCompare(b.name);});
    callback();
  }).catch(function(){callback();});
}

export function loadDrawingDots(shapes,level,callback){
  Dictionary.loadManifest('drawingDots',level).then(function(items){
    items.forEach(function(item){
      shapes.push({name:item.name,tags:item.tags,vb:item.viewBox,level:item.level,dots:item.dots,edges:item.edges,decor:item.decor});
    });
    callback();
  }).catch(function(){callback();});
}

export function loadAllDrawingDots(shapes,callback){
  Dictionary.loadManifest('drawingDots',1).then(function(l1){
    l1.forEach(function(item){
      shapes.push({name:item.name,tags:item.tags,vb:item.viewBox,level:item.level,dots:item.dots,edges:item.edges,decor:item.decor});
    });
    return Dictionary.loadManifest('drawingDots',2);
  }).then(function(l2){
    l2.forEach(function(item){
      shapes.push({name:item.name,tags:item.tags,vb:item.viewBox,level:item.level,dots:item.dots,edges:item.edges,decor:item.decor});
    });
    shapes.sort(function(a,b){var l=a.level-b.level;return l!==0?l:a.name.localeCompare(b.name);});
    callback();
  }).catch(function(){callback();});
}

export function loadImages(items,callback){
  Dictionary.loadManifest('image',1).then(function(loaded){
    loaded.forEach(function(item){items.push(item);});
    callback();
  }).catch(function(){callback();});
}
