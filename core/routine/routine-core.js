function toMins(t){
  const [h,m]=t.split(':').map(Number);
  return h*60+m;
}

function getTodayKey(){
  return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()];
}

function buildOrderedDays(routineData,todayKey){
  if(!routineData)return{days:[],focusedIndex:0};
  if(routineData.meta.rollingWindow){
    const allKeys=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    const todayIdx=allKeys.indexOf(todayKey);
    const r=routineData.meta.windowRadius||3;
    const keys=[];
    for(let i=-r;i<=r;i++)keys.push(allKeys[(todayIdx+i+7)%7]);
    const days=keys.map(k=>routineData.days.find(d=>d.key===k)).filter(Boolean);
    let fi=days.findIndex(d=>d.key===todayKey);
    if(fi===-1)fi=r;
    return{days,focusedIndex:fi};
  }else{
    return{days:routineData.days.slice(),focusedIndex:0};
  }
}

if(typeof module!=='undefined')module.exports={toMins,getTodayKey,buildOrderedDays};
