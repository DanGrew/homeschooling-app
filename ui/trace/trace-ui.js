class TraceEngine {
  constructor(svg, path, ball, progressPath, opts) {
    this.svg=svg; this.path=path; this.ball=ball; this.done=false; this.active=false; this._strokeJustCompleted=false;
    const o=opts||{};
    this.tolerance=o.tolerance??45; this.maxStep=o.maxStep??0.04; this.completionAt=o.completionAt??0.96; this.onComplete=o.onComplete||null;
    this.strokes=this._parseStrokes(o); this.currentStrokeIdx=0; this.currentDist=0;
    this.progressPaths=this.strokes.map(stroke=>{
      const pp=path.cloneNode(false);
      pp.setAttribute('d',stroke.d); pp.setAttribute('stroke',o.progressStroke||'#FFD700');
      o.progressWidth&&pp.setAttribute('stroke-width',o.progressWidth);
      o.progressStyle&&pp.setAttribute('style',o.progressStyle);
      pp.setAttribute('stroke-dasharray',stroke.totalLen+' '+stroke.totalLen);
      pp.setAttribute('stroke-dashoffset',stroke.totalLen);
      path.parentNode.insertBefore(pp,path.nextSibling); return pp;
    });
    this._reset(); o.interactive!==false&&this._bind();
  }
  _parseStrokes(o){
    return parseSubPaths(this.path.getAttribute('d')).map(subD=>{
      const mp=document.createElementNS('http://www.w3.org/2000/svg','path');
      mp.setAttribute('d',subD); mp.setAttribute('fill','none'); mp.setAttribute('stroke','none'); mp.style.pointerEvents='none'; this.svg.appendChild(mp);
      const totalLen=mp.getTotalLength(),N=400,samples=Array.from({length:N+1},(_,i)=>{const p=mp.getPointAtLength(i/N*totalLen);return{d:i/N*totalLen,x:p.x,y:p.y};});
      return{d:subD,totalLen,samples,sampleStep:totalLen/N,mp};
    });
  }
  restart(){this.done=false;this._reset();}
  _reset(){this.currentStrokeIdx=0;this.currentDist=0;this.active=false;this._strokeJustCompleted=false;this.progressPaths.forEach((pp,i)=>pp.setAttribute('stroke-dashoffset',this.strokes[i].totalLen));const p=this.strokes[0].samples[0];this.ball.setAttribute('cx',p.x);this.ball.setAttribute('cy',p.y);}
  _resetCurrentStroke(){const s=this.strokes[this.currentStrokeIdx],p=s.samples[0];this.currentDist=0;this.active=false;this.progressPaths[this.currentStrokeIdx].setAttribute('stroke-dashoffset',s.totalLen);this.ball.setAttribute('cx',p.x);this.ball.setAttribute('cy',p.y);}
  _svgPoint(x,y){const pt=this.svg.createSVGPoint();pt.x=x;pt.y=y;return pt.matrixTransform(this.svg.getScreenCTM().inverse());}
  _updatePosition(x,y){
    const stroke=this.strokes[this.currentStrokeIdx];
    const d=advanceDist(this._svgPoint(x,y),stroke,this.currentDist,this.tolerance,this.maxStep);
    if(d===null)return; this.currentDist=d;
    const snap=pointAtDist(stroke.samples,stroke.sampleStep,d);
    this.ball.setAttribute('cx',snap.x); this.ball.setAttribute('cy',snap.y);
    this.progressPaths[this.currentStrokeIdx].setAttribute('stroke-dashoffset',stroke.totalLen-d);
    d/stroke.totalLen>=this.completionAt&&this._completeStroke();
  }
  _completeStroke(){
    this.progressPaths[this.currentStrokeIdx].setAttribute('stroke-dashoffset',0);
    this._strokeJustCompleted=true; this.active=false;
    this.currentStrokeIdx<this.strokes.length-1?(this.currentStrokeIdx++,this.currentDist=0,this.ball.setAttribute('cx',this.strokes[this.currentStrokeIdx].samples[0].x),this.ball.setAttribute('cy',this.strokes[this.currentStrokeIdx].samples[0].y)):(this.done=true,this.onComplete&&this.onComplete());
  }
  startAnimation(durationMs){
    !this._animating&&(()=>{
      this.done=false; this._reset(); this._animating=true;
      const totalLen=this.strokes.reduce((s,str)=>s+str.totalLen,0); let startTime=null;
      const tick=ts=>{
        startTime=startTime||ts;
        const t=Math.min((ts-startTime)/durationMs,1),{strokeIdx:si,rem}=animationProgress(t,totalLen,this.strokes);
        for(let i=0;i<si;i++) this.progressPaths[i].setAttribute('stroke-dashoffset',0);
        this.currentStrokeIdx=si; this.currentDist=rem;
        const pt=pointAtDist(this.strokes[si].samples,this.strokes[si].sampleStep,rem);
        this.ball.setAttribute('cx',pt.x); this.ball.setAttribute('cy',pt.y);
        this.progressPaths[si].setAttribute('stroke-dashoffset',this.strokes[si].totalLen-rem);
        t<1?this._rafId=requestAnimationFrame(tick):(this._animating=false,this.done=true,this.onComplete&&this.onComplete());
      };
      this._rafId=requestAnimationFrame(tick);
    })();
  }
  stopAnimation(){this._rafId&&cancelAnimationFrame(this._rafId);this._animating=false;}
  _bind(){
    this.activePointerId=null;
    this.svg.addEventListener('pointerdown',e=>{
      !(this.done||this.active)&&(()=>{
        const pt=this._svgPoint(e.clientX,e.clientY),s=this.strokes[this.currentStrokeIdx].samples[0];
        (pt.x-s.x)**2+(pt.y-s.y)**2<=this.tolerance**2&&(e.preventDefault(),this.svg.setPointerCapture(e.pointerId),this._strokeJustCompleted=false,this.active=true,this.activePointerId=e.pointerId);
      })();
    });
    this.svg.addEventListener('pointermove',e=>{
      this.active&&!this.done&&e.pointerId===this.activePointerId&&(e.preventDefault(),this._updatePosition(e.clientX,e.clientY));
    });
    const stop=e=>e.pointerId===this.activePointerId&&!this.done&&(this._strokeJustCompleted?(this._strokeJustCompleted=false):this.active&&(this.active=false,this.activePointerId=null,this._resetCurrentStroke()));
    this.svg.addEventListener('pointerup',stop);
    this.svg.addEventListener('pointercancel',stop);
  }
}
