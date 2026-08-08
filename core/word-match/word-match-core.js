export function getDistractors(target,items,n,rng){
  rng = rng || Math.random;
  var withTag=items.filter(function(i){
    return i.id!==target.id&&target.tags.some(function(t){return i.tags.indexOf(t)!==-1;});
  });
  var pool=withTag.length>=n?withTag:items.filter(function(i){return i.id!==target.id;});
  return pool.sort(function(){return rng()-0.5;}).slice(0,n);
}

export function buildRound(items,rng){
  rng = rng || Math.random;
  var target=items[Math.floor(rng()*items.length)];
  var choices=[target].concat(getDistractors(target,items,3,rng)).sort(function(){return rng()-0.5;});
  return{target:target,choices:choices};
}
