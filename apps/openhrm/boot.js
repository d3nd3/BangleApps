let origHRMs = {};
let OpenHRM = (function() {
  const s = require('Storage');
  let SETTINGS = s.readJSON("openhrm.settings.json") || {};
  if (SETTINGS.enabled) {
    var hrmBlob = (function(){
      var bin=atob("AUt7RBhocEcyBAAALenwR+pM604NaHxEfkQiaDN4svvz9wf7EyPnSiX4EwB6RBOIGEQAshCA5Eh4RAd4I2ifQg3YE4gkaAd4MHjkG7T78PYG+xBANfgQABsaG7ITgNtK20jcS9xPekR4RBZoBHi2+/T+e0QO+xRkG4jOaH9EG7I/eJP79/Mm+BQwE2gDK0DyjYEUaAd4BngDeKTxAw6++/f8DPsX7mcet/vz/Az7E3cCPDX4FzC0+/b3B/sWRDX4HuA1+BRAc0Sj60QD0vgA4AR4F2gGeL779PwCPwz7FOS3+/b+DvsWdjX5FEA1+RZQFmjR+AjgZBsFeLb79fcH+xVlZBAXaC74FUAFeE5ot/v1/Az7FXUbshdoJvgVMA1pAXi3+/H8DPsRcQAnJfgRcBFoHylA8jqB0vgAgKdJkPgAwKjxIAh5RLj7/PoK+xyMsfgAkD75HMAP+on5zEUn0Uf2/3yh+ADA0vgAgJD4AMCx+ACQx+sICLj7/PoK+xyMD/qJ+T75HMDMRQ3a0vgAgJD4AMDH6wgIuPv8+Qn7HIw++RzAofgAwAE3IC/c0QTgCogSspRCuL8MgIlIiU+KSnhEf0TQ+ADAOXis8SAMekS8+/H5CfsRwbL4AIA2+REQD/qI+EFFJ9FH9v9xEYAAIdD4AICX+ADAsvgAkMHrCAi4+/z6CvscjA/6ifk2+RzAzEUN2tD4AICX+ADAwesICLj7/PkJ+xyMNvkcwKL4AMABMSAp3NEE4BGICbKLQri/E4BqSN/4qIFqSnhE+EQHaJj4ABAgP3pEt/vx+Qn7EXGy+ADAPvkREA/6jPxhRSXRT/QAQRGAREYAIdD4AMAneLL4AIDB6wwMvPv3+Qn7F8cP+oj4PvkXcEdFC93Q+ADAJ3jB6wwMvPv3+Aj7F8c++RdwF4ABMSAp39EE4BGICbKMQsi/FIBMSExMTUp4RHxEB2gheCA/ekS3+/H8DPsRcbL4AOA2+REQD/qO/nFFJNFP9ABBEYAAIdD4AOAneLL4AMDB6w4Ovvv3+Aj7F+cP+oz8NvkXcGdFC93Q+ADgJ3jB6w4Ovvv3/Az7F+c2+RdwF4ABMSAp39EE4BGICbKLQsi/E4AvSjBMekQH7pA6EoguSnpEfEQSiC1KekT47ud6EYgsSnpEEIgSiJTtAGoLGhuyB+4QOhKy+O7HagfuECq47sd6pu6GevTux3rx7hD6DNUhS3tEGmggS3tEG3iy+/PxAfsTIxkiJfgTIBxKekQTaAEzE2C96PCHAL8eBAAAEAQAAAwEAADxAwAAzgMAAMADAADGAwAArQMAAOoCAAB0AgAAZgIAAFICAADqAQAA3AEAAMwBAABoAQAAWgEAAFQBAADaAAAA2AAAAN4AAADQAAAAvAAAAKAAAACOAAAAhgAAAP9/AICamRk+QAEAgM3MzDz/fwAAAAAAAAAAAAAAAAAA");
      return {
        onHRM:E.nativeCall(13, "void(int,int)", bin),
        getTick:E.nativeCall(1, "int()", bin),
      };
    })();
    hrmBlob.windowSize = 32;
    hrmBlob.amps = new Int16Array(hrmBlob.windowSize);
    hrmBlob.deris = new Int16Array(hrmBlob.windowSize);
    hrmBlob.grads = new Int16Array(hrmBlob.windowSize);
    hrmBlob.avgs = new Int16Array(hrmBlob.windowSize);
    hrmBlob.partial = new Int16Array(hrmBlob.windowSize);
    let inputs = new Uint32Array(6);
    hrmBlob.hr = 0;

    var ampsAddr = E.getAddressOf(hrmBlob.amps,true);
    if (!ampsAddr) {
    throw new Error("Not a Flat String");
    }
    var derisAddr = E.getAddressOf(hrmBlob.deris,true);
    if (!derisAddr) {
    throw new Error("Not a Flat String");
    }
    var gradsAddr = E.getAddressOf(hrmBlob.grads,true);
    if (!gradsAddr) {
    throw new Error("Not a Flat String");
    }
    var avgsAddr = E.getAddressOf(hrmBlob.avgs,true);
    if (!avgsAddr) {
    throw new Error("Not a Flat String");
    }
    var partsAddr = E.getAddressOf(hrmBlob.partial,true);
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
    
    let rawHRM = function(hrm) {
      hrmBlob.onHRM(hrm.filt,inputsAddr);
      hrm.bpm = hrmBlob.hr;
      hrm.confidence = 100;
      origHRMs.emit("HRM",hrm);
    };
    let doOnce = false;
    Bangle.on = ( (o)=>{
    return function (event,handler) {
      if (event === "HRM") {
          //gobble
        origHRMs.on("HRM",handler);
        if (!doOnce) {
          o.call(Bangle,'HRM-raw',rawHRM);
          doOnce = true;
        }
      } else
      o.call(Bangle,event,handler);
    };
    }) (Bangle.on);
    Bangle.removeListener = ( (o)=>{
    return function(event,listener) {
      if (event === "HRM") origHRMs.removeListener(event,listener);
      else o.call(Bangle,event,listener);
    };
    }) (Bangle.removeListener);
    return hrmBlob;
  }
})();