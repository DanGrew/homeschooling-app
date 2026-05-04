export function extractTags(items){
  var tags=['all'];
  items.forEach(function(p){(p.tags||[]).forEach(function(t){if(tags.indexOf(t)<0)tags.push(t);});});
  return tags;
}

export function extractLevels(items){
  var levels=[];
  items.forEach(function(p){if(p.level!==undefined&&levels.indexOf(p.level)<0)levels.push(p.level);});
  return levels.sort(function(a,b){return a-b;});
}

export function filterItems(items,activeTag,activeLevel){
  return items.filter(function(p){
    var tagOk=activeTag==='all'||(p.tags||[]).indexOf(activeTag)>=0;
    var levelOk=activeLevel==='all'||p.level===activeLevel;
    return tagOk&&levelOk;
  });
}
