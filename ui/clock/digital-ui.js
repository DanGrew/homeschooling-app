var AMPM = 'AM AM AM AM AM AM AM AM AM AM AM AM PM PM PM PM PM PM PM PM PM PM PM PM'.split(' ');
var H12  = [12,1,2,3,4,5,6,7,8,9,10,11,12,1,2,3,4,5,6,7,8,9,10,11];

export function render(hour, minute = 0) {
  var minStr = ('0' + minute).slice(-2);
  document.getElementById('digital-12h').textContent = H12[hour] + ':' + minStr + ' ' + AMPM[hour];
  document.getElementById('digital-24h').textContent = ('0' + hour).slice(-2) + ':' + minStr;
}
