import {speak} from '../speech/speech-ui.js';
import {buildRound} from '../../core/word-match/word-match-core.js';

var current,locked;

function makeBtn(item,items){
  var btn=document.createElement('button');
  btn.dataset.id=item.id;
  btn.style.cssText='display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px;border:3px solid #ddd;border-radius:16px;background:#fff;cursor:pointer;touch-action:manipulation;-webkit-touch-callout:none;user-select:none;width:clamp(120px,22vmin,180px);font-family:inherit;';
  var img=document.createElement('img');
  img.src=item.url;img.alt=item.name;
  img.style.cssText='width:clamp(80px,16vmin,140px);height:clamp(80px,16vmin,140px);object-fit:contain;pointer-events:none;';
  btn.appendChild(img);
  btn.onclick=function(){pick(btn,item,items);};
  return btn;
}

function pick(btn,item,items){
  if(locked)return;
  if(item.id===current.target.id){
    locked=true;
    btn.classList.add('feedback-correct');
    window.showBanner(function(){btn.classList.remove('feedback-correct');renderRound(items);});
  }else{
    btn.classList.add('feedback-wrong');
    setTimeout(function(){btn.classList.remove('feedback-wrong');},500);
  }
}

export function renderRound(items){
  current=buildRound(items);locked=false;
  document.getElementById('wm-word').textContent=current.target.name;
  var grid=document.getElementById('wm-choices');
  grid.innerHTML='';
  current.choices.forEach(function(item){grid.appendChild(makeBtn(item,items));});
}

export function getCurrentTarget(){return current&&current.target;}

export function init(items){
  document.getElementById('wm-say').onclick=function(){speak(current.target.name);};
  renderRound(items);
}
