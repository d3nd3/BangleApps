const s = require('Storage');
let SETTINGS = s.readJSON("openhrm.settings.json") || {};
if (SETTINGS.enabled) {
  Bangle.setLCDPower(1);
  Bangle.setHRMPower(1);
  Bangle.setOptions({lcdPowerTimeout:0,backlightTimeout:0,powerSave:false});
  Bangle.setPollInterval(80);

  let lasttick = 0;
  Bangle.on("HRM",(hrm)=>{
    //how many hrm ticks within 5 second interval, B1=50hz hrm, B2=25hz hrm
    //if cpu is busy, can't get max ticks
    let now=Date.now();
    let tickrate = 0;
    tickrate = ((tickrate*63)+now-lasttick)/64;
    lasttick = now;
    print("tickrate : " + tickrate);

    let tick = OpenHRM.getTick();
    g.clear(true);
    g.setFont("4x6:0.5");
    let flatAmps = [];
    let flatDeri = [];
    let flatGrad = [];
    let flatPartial = [];
      //let flatAverages = [];
      //let flatBeats = [];
    for ( let i = 0; i < OpenHRM.windowSize; i++ ) {
      flatAmps.push(OpenHRM.amps[(tick + 1 + i) % OpenHRM.windowSize]);
      flatDeri.push(OpenHRM.deris[(tick + 1 + i) % OpenHRM.windowSize]);
      flatGrad.push(OpenHRM.grads[(tick + 1 + i) % OpenHRM.windowSize]);
      flatPartial.push(OpenHRM.partial[(tick + 1 + i) % OpenHRM.windowSize]);
    }
      //white
    require("graph").drawLine(g, flatAmps,{axes:false,miny:-600,maxy:600,gridy:200});
    g.setColor(0,1,1);
      //cyan
    require("graph").drawLine(g, flatDeri,{axes:false,miny:-50,maxy:50});
    g.setColor(0,1,0);
      //green
    require("graph").drawLine(g, flatGrad,{axes:false,miny:-50,maxy:50});
    g.setColor(1,0,1);
      //purple
    require("graph").drawLine(g, flatPartial,{axes:false,miny:0,maxy:50});
    g.setColor(1,1,1);
      //red
    g.setFont("Vector:32");
    g.drawString(OpenHRM.hr.toString(),180,40);
  });

}