(function(back) {
  var FILE="openhrm.settings.json";
  var settings;
  
  function writeSettings(key, value) {
    var s = require('Storage').readJSON(FILE, true) || {};
    s[key] = value;
    require('Storage').writeJSON(FILE, s);
    readSettings();
  }

  function readSettings(){
    settings = require('Storage').readJSON(FILE, true) || {};
  }

  readSettings();

  function buildMainMenu(){
    var mainmenu = {};

    mainmenu[''] = { 'title': 'OpenHRM', back: back };

    mainmenu['Enable Alg'] = {
        value: !!settings.enabled,
        onchange: v => {
          writeSettings("enabled",v);
        }
      };
    return mainmenu;
  }

  E.showMenu(buildMainMenu());
})
