const SETTINGS = s.readJSON("openhrm.json") || {};
if (SETTINGS.enabled) {
  var c = E.compiledC(`
  // void onHRM(int,int)
  // int getTick()

    volatile unsigned int hr;
    volatile unsigned int tick;
    volatile short rollingAvg = 0;
    volatile short minGrad = 32767;
    volatile short maxGrad = -32768;
    volatile short minDeri = 32767;
    volatile short maxDeri = -32768;

    volatile const unsigned char windowSize = 64;
    volatile const unsigned char rollLen = 1;
    volatile const float oderi = 0.025;
    volatile const float ograd = 0.15;

    #pragma pack(push, 1)
    typedef struct inputs {
      short * amps;
      short * deris;
      short * grads;
      short * avgs;
      short * parts;
    } inputs_t;
    #pragma pack(pop)

    void onHRM(int amp,void *argss){
      inputs_t* args = argss;
      args->amps[tick % windowSize] = amp;

      rollingAvg = rollingAvg + amp;
      if ( tick >= rollLen ) {
        rollingAvg = rollingAvg - args->amps[(tick-rollLen) % windowSize];
      }
      args->avgs[tick % windowSize] = rollingAvg/rollLen;
      if ( tick > 3 ) {
        unsigned int cc = tick-2;
        short * use = args->amps; //use avg?
        short deriV = use[(cc-1) % windowSize] - 2 * use[cc % windowSize] + use[(cc+1) % windowSize];
      //short deriV = use[(cc-2) % windowSize] - 4 * use[(cc-1) % windowSize] + 6 * use[cc % windowSize] - 4 * use[(cc+1) % windowSize] + use[(cc+2) % windowSize];
        short gradV = (use[(tick) % windowSize] - use[(tick-2) % windowSize])>>1;
      //gradV = (gradV < 0) ? -gradV : gradV;
        args->grads[tick % windowSize] = gradV;
        args->deris[tick % windowSize] = deriV;

        args->parts[tick % windowSize] = 0;
        const short wdw = 32;
        if ( tick >= wdw ) {
          if ( minGrad == args->grads[(tick-wdw) % windowSize] )
          {
            minGrad = 32767; //recalculate min
            for ( int i = 0; i < wdw; i++ ) {
              if ( args->grads[(tick-i) % windowSize] < minGrad )
                minGrad = args->grads[(tick-i) % windowSize];
            }
          } else {
            if ( gradV < minGrad ) minGrad = gradV;
          }
          if ( minDeri == args->deris[(tick-wdw) % windowSize] )
          {
            minDeri = 32767; //recalculate min
            for ( int i = 0; i < wdw; i++ ) {
              if ( args->deris[(tick-i) % windowSize] < minDeri )
                minDeri = args->deris[(tick-i) % windowSize];
            }
          } else {
            if ( deriV < minDeri ) minDeri = deriV;
          }
          if ( maxGrad == args->grads[(tick-wdw) % windowSize] )
          {
            maxGrad = -32768; //recalculate max
            for ( int i = 0; i < wdw; i++ ) {
              if ( args->grads[(tick-i) % windowSize] > maxGrad )
                maxGrad = args->grads[(tick-i) % windowSize];
            }
          } else {
            if ( gradV > maxGrad ) maxGrad = gradV;
          }
          if ( maxDeri == args->deris[(tick-wdw) % windowSize] )
          {
            maxDeri = -32768; //recalculate min
            for ( int i = 0; i < wdw; i++ ) {
              if ( args->deris[(tick-i) % windowSize] > maxDeri )
                maxDeri = args->deris[(tick-i) % windowSize];
            }
          } else {
            if ( deriV > maxDeri ) maxDeri = deriV;
          }
          short rangeGrad = maxGrad - minGrad;
          short rangeDeri = maxDeri - minDeri;
        //gradV < minGrad+rangeGrad*ograd
          if (  deriV < minDeri+rangeDeri*oderi ) args->parts[tick % windowSize] = 25;
        }
      }
      tick++;
    }
    int getTick(){
      return tick;
    }
    `);

  Bangle.setLCDTimeout(0);
  Bangle.setLCDPower(1);
  Bangle.setHRMPower(1);
  Bangle.setOptions({lcdPowerTimeout:0,backlightTimeout:0,powerSave:false});
  Bangle.setPollInterval(80);
  let windowSize = 64;
  var amps = new Int16Array(windowSize);
  var deris = new Int16Array(windowSize);
  var grads = new Int16Array(windowSize);
  var avgs = new Int16Array(windowSize);
  var partial = new Int16Array(windowSize);
  var inputs = new Uint32Array(6);
  let hr = 0;

  var ampsAddr = E.getAddressOf(amps,true);
  if (!ampsAddr) {
    throw new Error("Not a Flat String");
  }
  var derisAddr = E.getAddressOf(deris,true);
  if (!derisAddr) {
    throw new Error("Not a Flat String");
  }
  var gradsAddr = E.getAddressOf(grads,true);
  if (!gradsAddr) {
    throw new Error("Not a Flat String");
  }
  var avgsAddr = E.getAddressOf(avgs,true);
  if (!avgsAddr) {
    throw new Error("Not a Flat String");
  }
  var partsAddr = E.getAddressOf(partial,true);
  if (!partsAddr) {
    throw new Error("Not a Flat String");
  }
  inputs[0] = ampsAddr;
  inputs[1] = derisAddr;
  inputs[2] = gradsAddr;
  inputs[3] = avgsAddr;
  inputs[4] = partsAddr;
  var inputsAddr = E.getAddressOf(inputs,true);
  if (!inputsAddr) {
    throw new Error("Not a Flat String");
  }

  let tickBefore = 0;
  setInterval(function hmm(){
    //how many hrm ticks within 5 second interval, B1=50hz hrm, B2=25hz hrm
    //if cpu is busy, can't get max ticks
    let tick=c.getTick();
    print("true hrm polling : ",(tick-tickBefore)/5);
    tickBefore = tick;
    return;
    g.clear(true);
    g.setFont("4x6:0.5");
    let flatAmps = [];
    let flatDeri = [];
    let flatGrad = [];
    let flatPartial = [];
      //let flatAverages = [];
      //let flatBeats = [];
    for ( let i = 0; i < windowSize; i++ ) {
      flatAmps.push(amps[(tick + 1 + i) % windowSize]);
      flatDeri.push(deris[(tick + 1 + i) % windowSize]);
      flatGrad.push(grads[(tick + 1 + i) % windowSize]);
      flatPartial.push(partial[(tick + 1 + i) % windowSize]);
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
    g.drawString(hr.toString(),180,40);
  },5000);

  let rawHRM = function(hrm) {
    c.onHRM(hrm.filt,inputsAddr);
  };

  let myHRM = function(hrm) {
    print("myHrm");
    hrm.bpm = hr;
    hrm.confidence = 100;
    origHRMs.emit("HRM",hrm);
  };
  let myObj = {
    origOn: Bangle.on
  };
  let doOnce = false;
  let origHRMs = {};
  Bangle.on = function (event,handler) {
    if (event === "HRM") {
      origHRMs.on("HRM",handler);
      handler = myHRM;
      if (!doOnce) {
        Bangle.on('HRM-raw',rawHRM);
        doOnce = true;
      }
    }
    myObj.origOn.call(Bangle,event,handler);
  };
  Bangle.removeListener = ( (o)=>{
    return function(event,listener) {
      if (event === "HRM") origHRMs.removeListener(event,listener);
      else o(event,listener);
    };
  }) (Bangle.removeListener);
}

