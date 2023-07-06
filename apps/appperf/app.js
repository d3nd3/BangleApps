const SETTINGS = s.readJSON("openhrm.json") || {};
Bangle.setUI(
  {mode:"custom",remove:()=>{print("removed");}}
   );
Bangle.showClock();
Bangle.setPollInterval(settings.poll);

let prev = 0;
let count = 0;
let avg = 0;
let max = peek32(0xE000E014);
setInterval(()=>{
  let now = peek32(0xE000E018);
  if ( prev > 0 ) {
    if ( now > prev ) now -=max;
    let diff = prev-now

    count += 1;
    avg += diff;
    let a = avg / count;
    print("c = " ,a.toFixed(2));
    g.setFont("Vector:24");
    g.drawString(a.toFixed(2),g.getWidth()/2,g.getHeight()/2,true);
  }
  prev = now;
},250);