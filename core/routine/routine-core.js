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

const SLOT_PX = { 15: 28, 30: 44, 60: 64 };

function pixelsPerMin(slotMins) {
  return SLOT_PX[slotMins] / slotMins;
}

function formatTimeLabel(totalMins) {
  const h = Math.floor(totalMins / 60), min = totalMins % 60;
  return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
}

function slotLineClass(absMin, slotMins) {
  if (absMin % 60 === 0) return 'hour';
  if (absMin % slotMins === 0) return 'slot';
  return '';
}

function blockLayout(startM, endM, gridStartMins, ppm) {
  return { top: (startM - gridStartMins) * ppm, height: Math.max((endM - startM) * ppm, 20) };
}

function focusedScrollX(colOffsetLeft, colOffsetWidth, containerWidth) {
  return Math.max(0, colOffsetLeft - (containerWidth / 2 - colOffsetWidth / 2));
}

function nowScrollTop(nowMins, gridStartMins, ppm, containerHeight, dayHeaderH) {
  return Math.max(0, dayHeaderH + (nowMins - gridStartMins) * ppm - containerHeight / 2);
}

if(typeof module!=='undefined')module.exports={toMins,getTodayKey,buildOrderedDays,pixelsPerMin,formatTimeLabel,slotLineClass,blockLayout,focusedScrollX,nowScrollTop};
