export function hexToRgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
export function rgbToHex(r,g,b){return'#'+[r,g,b].map(function(v){return Math.round(v).toString(16).padStart(2,'0');}).join('');}
export function mixHex(a,b){var ra=hexToRgb(a),rb=hexToRgb(b);return rgbToHex((ra[0]+rb[0])/2,(ra[1]+rb[1])/2,(ra[2]+rb[2])/2);}

export var BASE_COLOURS=[
  {name:'Red',    base:'#E74C3C',light:'#F1948A',dark:'#922B21'},
  {name:'Blue',   base:'#3498DB',light:'#85C1E9',dark:'#1A5276'},
  {name:'Yellow', base:'#F1C40F',light:'#F9E79F',dark:'#B7950B'},
  {name:'Green',  base:'#2ECC71',light:'#82E0AA',dark:'#1A7A43'},
  {name:'Orange', base:'#E67E22',light:'#F0B27A',dark:'#935116'},
  {name:'Purple', base:'#9B59B6',light:'#C39BD3',dark:'#6C3483'},
  {name:'Pink',   base:'#FF69B4',light:'#FFB3D9',dark:'#C2185B'},
  {name:'Brown',  base:'#795548',light:'#A1887F',dark:'#4E342E'},
  {name:'Black',  base:'#333333',light:'#888888',dark:'#111111'},
  {name:'White',  base:'#F5F5F5',light:'#FFFFFF',dark:'#CCCCCC'},
];

export function baseOf(c){
  for(var i=0;i<BASE_COLOURS.length;i++){var b=BASE_COLOURS[i];if(b.base===c||b.light===c||b.dark===c)return b.base;}
  return null;
}
