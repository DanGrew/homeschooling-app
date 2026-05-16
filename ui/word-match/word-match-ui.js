import {makeSpeakable} from '../../components/speech/speakable.js';
import {buildRound} from '../../core/word-match/word-match-core.js';
import {showBanner, hideBanner} from '../../components/success-banner.js';

var current,locked;

function showSuccess(onNext){
  showBanner({ buttons: [{ label: 'Next \u2192', onClick: function() { hideBanner(); onNext(); } }] });
}

function makeBtn(item,items){
  var btn=document.createElement('button');
  btn.dataset.id=item.id;
  btn.style.cssText='display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px;border:3px solid #ddd;border-radius:16px;background:#fff;cursor:pointer;touch-action:manipulation;-webkit-touch-callout:none;user-select:none;width:clamp(120px,22vmin,180px);font-family:inherit;';
  var img=document.createElement('img');
  img.src=item.url;img.alt=item.name;
  img.style.cssText='width:clamp(80px,16vmin,140px);height:clamp(80px,16vmin,140px);object-fit:contain;pointer-events:none;';
  btn.appendChild(img);
  btn.onclick=function(){pick(btn,item,items);};
  makeSpeakable(btn, item.name);
  return btn;
}

var PICK_CORRECT = {
  'true': (btn,items) => { locked=true;btn.classList.add('feedback-correct');showSuccess(function(){btn.classList.remove('feedback-correct');renderRound(items);}); },
  'false': (btn) => { btn.classList.add('feedback-wrong');setTimeout(function(){btn.classList.remove('feedback-wrong');},500); }
};
var PICK_LOCKED = { 'true': () => {}, 'false': (btn,item,items) => PICK_CORRECT[String(item.id===current.target.id)](btn,items) };

function pick(btn,item,items){
  PICK_LOCKED[String(locked)](btn,item,items);
}

export function renderRound(items){
  current=buildRound(items);locked=false;
  document.getElementById('wm-word').textContent=current.target.name;
  var grid=document.getElementById('wm-choices');
  grid.innerHTML='';
  current.choices.forEach(function(item){grid.appendChild(makeBtn(item,items));});
}

export function getCurrentTarget(){return current?.target;}

export function init(items){
  var wordEl=document.getElementById('wm-word');
  wordEl.style.cursor='pointer';
  makeSpeakable(wordEl,() => current?.target?.name);
  renderRound(items);
}
