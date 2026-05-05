function bestVoice(){
  var v=speechSynthesis.getVoices();
  return v.find(function(x){return x.lang==='en-GB'&&x.name.match(/female|woman|girl|karen|serena|moira|kate/i);})
    ||v.find(function(x){return x.lang==='en-GB';})
    ||v.find(function(x){return x.lang.startsWith('en');})
    ||null;
}

export function speak(word){
  if(!word)return;
  var u=new SpeechSynthesisUtterance(word);
  u.rate=1.0;u.pitch=1.1;
  var v=bestVoice();if(v)u.voice=v;
  speechSynthesis.cancel();speechSynthesis.speak(u);
}
