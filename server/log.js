
function pad(s, n, p) {
  p = p || ' ';
  var pads = '';
  for (var i = 0; i < n - s.toString().length; i++) {
    pads += p;
  }
  return pads + s;
}

module.exports.l = require('tracer').colorConsole({
  format: [
    "{{timestamp}} {{title}} {{file}}:{{line}}: {{message}}",
    {
      error: "{{timestamp}} {{title}} {{file}}:{{line}}: {{message}}\nCall Stack:\n{{stack}}"
    }
  ],
  dateformat : "HH:MM:ss.L",
  preprocess: function(data) {
    data.title = pad(data.title.toUpperCase(), 5);
    var spaces = '';
    for (var i = 0; i < 15 - data.file.length; i++) {
      spaces += ' ';
    }
    data.file = pad(data.file, 20);
    data.line = pad(data.line, 4);
  }
});
