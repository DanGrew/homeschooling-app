function loadColouringPictures(pictures,callback){
  Dictionary.loadAll(['colouring']).then(function(items){
    items.forEach(function(item){
      if(!item.colouring)return;
      pictures.push({name:item.name,tags:item.tags,vb:item.viewBox,shapes:item.colouring.shapes});
    });
    callback();
  }).catch(function(){callback();});
}

function loadConnectDots(shapes,callback){
  Dictionary.loadAll(['connectDots']).then(function(items){
    items.forEach(function(item){
      if(!item.connectDots)return;
      shapes.push({name:item.name,tags:item.tags,vb:item.viewBox,dots:item.connectDots.dots,guides:item.connectDots.guides,decor:item.connectDots.decor});
    });
    callback();
  }).catch(function(){callback();});
}

function loadDrawingDots(shapes,level,callback){
  var repKey='drawingDots'+level;
  Dictionary.loadAll([repKey]).then(function(items){
    items.forEach(function(item){
      if(!item[repKey])return;
      shapes.push({name:item.name,tags:item.tags,vb:item.viewBox,dots:item[repKey].dots,edges:item[repKey].edges,decor:item[repKey].decor});
    });
    callback();
  }).catch(function(){callback();});
}
