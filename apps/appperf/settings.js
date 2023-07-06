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
        }
      };
    return mainmenu;
  }

  E.showMenu(buildMainMenu());
})
