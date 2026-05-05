export function getDistractors(target,items,n){
  var withTag=items.filter(function(i){
    return i.id!==target.id&&target.tags.some(function(t){return i.tags.indexOf(t)!==-1;});
  });
  var pool=withTag.length>=n?withTag:items.filter(function(i){return i.id!==target.id;});
  return pool.slice().sort(function(){return Math.random()-0.5;}).slice(0,n);
}

export function buildRound(items){
  var target=items[Math.floor(Math.random()*items.length)];
  var choices=[target].concat(getDistractors(target,items,3)).sort(function(){return Math.random()-0.5;});
  return{target:target,choices:choices};
}

if(typeof module!=='undefined')module.exports={getDistractors,buildRound};
