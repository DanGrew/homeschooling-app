import Dictionary from './dictionary-core.js';

function onErr(onError,callback){return function(err){if(onError)onError(err);else callback();};}

export function loadColouringPictures(pictures,callback,onError){
  Dictionary.loadManifest('colouring').then(function(items){
    items.forEach(function(item){
      pictures.push({name:item.name,tags:item.tags,vb:item.viewBox,shapes:item.shapes});
    });
    callback();
  }).catch(onErr(onError,callback));
}

export function loadConnectDots(shapes,callback,onError){
  Dictionary.loadManifest('connectDots').then(function(items){
    items.forEach(function(item){
      shapes.push({name:item.name,tags:item.tags,vb:item.viewBox,dots:item.dots,guides:item.guides,decor:item.decor});
    });
    shapes.sort(function(a,b){return a.name.localeCompare(b.name);});
    callback();
  }).catch(onErr(onError,callback));
}

export function loadImages(items,callback,onError){
  Dictionary.loadManifest('image').then(function(loaded){
    loaded.forEach(function(item){items.push(item);});
    callback();
  }).catch(onErr(onError,callback));
}
