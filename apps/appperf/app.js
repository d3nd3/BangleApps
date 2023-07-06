{
const s = require('Storage');
let SETTINGS = s.readJSON("appperf.settings.json") || s.readJSON("appperf.default.json", true) || {};
Bangle.setUI(
{mode:"custom",remove: ()=> {
  print("trigger fastload into clock");
}
});

Bangle.showClock(); //calls load

Bangle.setPollInterval(SETTINGS.poll ? SETTINGS.poll : 80);

let prev = 0;
let count = 0;
let avg = 0;
let max = peek32(0xE000E014);
setInterval(()=>{
let now = peek32(0xE000E018);
if ( prev > 0 ) {
  if ( now > prev ) now -=max;
  let diff = prev-now;

  count += 1;
  avg += diff;
  let a = ((avg / count)/10000).toFixed(0).toString();
  print("c = " ,a);
  g.setFont("Vector:36").setColor(1,0,1).setFontAlign(0,0);

  g.drawString(a.padStart(5, '0'),g.getWidth()/2,g.getHeight()/2,true);
}
prev = now;
},250);
setTimeout(()=>{delete Bangle.uiRemove;},1); //ensure do not fastload out
}