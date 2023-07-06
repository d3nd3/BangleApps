(function(back) {
  function writeSettings(key, value) {
    var s = Object.assign(
        require('Storage').readJSON(settingsDefaultFile, true) || {},
        require('Storage').readJSON(settingsFile, true) || {});
    s[key] = value;
    require('Storage').writeJSON(settingsFile, s);
    readSettings();
  }

  function readSettings() {
    settings = Object.assign(
    require('Storage').readJSON(settingsDefaultFile, true) || {},
    require('Storage').readJSON(settingsFile, true) || {});
  }

  var settingsFile = "appperf.settings.json";
  var settingsDefaultFile = "appperf.default.json";

  var settings;
  readSettings();

  function buildMainMenu(){
    var mainmenu = {};
    mainmenu[''] = { 'title': 'Cpu Benchmark', back: back };
    mainmenu['Polling Interval'] = {
        value: settings.poll,
        onchange: v => {
          writeSettings("poll",v);
        },
        format: v => v + "ms",
        min: 10,
        max: 4000,
        step: 35
    };

  mainmenu['Apply Polling onBoot'] = {
      value: !!settings.pollPersist,
      onchange: v => {
        writeSettings("pollPersist",v);
        if (v) {
          if (mainmenu['Clock=SlowPoll NonClock=FastPoll'].value) {
            mainmenu['Clock=SlowPoll NonClock=FastPoll'].onchange(false);
            setTimeout(()=>E.showMenu(buildMainMenu()), 0);
          }
          require("Storage").write("appperf.boot.js", `Bangle.setPollInterval(${settings.poll})`);
        } else {
          require("Storage").erase("appperf.boot.js");
        }
      }
  };

  mainmenu['Clock=SlowPoll NonClock=FastPoll'] = {
      value: !!settings.pollModeClock,
      onchange: v => {
        writeSettings("pollModeClock",v);
        if (v) {
          if (mainmenu['Apply Polling onBoot'].value) {
            mainmenu['Apply Polling onBoot'].onchange(false);
            setTimeout(()=>E.showMenu(buildMainMenu()), 0);
          }
          require("Storage").write("appperf.boot.js",
`{
let u = () => {
  if (typeof __FILE__ === "undefined" || __FILE__ == ".bootcde") Bangle.setPollInterval(800);
  else Bangle.setPollInterval(80);
};
u();
Bangle.load=(o=>n=>{
  o(n);u();
})(Bangle.load);
}`);
        } else {
          require("Storage").erase("appperf.boot.js");
        }
      }
  };
    return mainmenu;
  }

  E.showMenu(buildMainMenu());
})
