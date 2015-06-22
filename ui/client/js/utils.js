
Template.registerHelper("setTitle", function(title) {
  document.title = title;
  return null;
});

Template.registerHelper("log", function(something) {
  console.log.apply(console, Array.prototype.slice.call(arguments, 0, arguments.length - 1));
});

sigFigs = function(m, n) {
  n = n || 3;
  var leftOfDecimal = Math.ceil(Math.log(m) / Math.log(10));
  return m.toFixed(Math.max(0, n - leftOfDecimal));
};

formatTime = function(ms) {
  var S = 1000;
  var M = 60*S;
  var H = 60*M;
  var D = 24*H;

  if (ms < M) {
    if (ms < S) {
      return ms + ' ms';
    }
    return sigFigs(ms/1000) + ' s';
  }

  var highestLevel = -1;
  var levels = [[D,'d'],[H,'h'],[M,'m'],[S,'s']/*,[1,'ms']*/];
  var r =
        levels.map(function(level, idx) {
          if (ms > level[0]) {
            if (highestLevel < 0) {
              highestLevel = idx;
            }
            var v = Math.floor(ms / level[0]);
            ms -= v*level[0];
            return v+level[1];
          }
        });

  return [r[highestLevel], r[highestLevel+1]].join(' ');
};
Template.registerHelper("formatTime", formatTime);

Template.registerHelper("orZero", function(n) { return n || 0; });
Template.registerHelper("orEmpty", function(n) { return n || {}; });

Template.registerHelper("formatDateTime", function(dt) {
  return dt && moment(dt).format("YYYY/MM/DD HH:mm:ss") || "-";
});

formatBytes = function(bytes) {
  if (!bytes) return "-";
  var base = 1024;
  var cutoff = 2;
  var levels = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  for (var i = 0; i < levels.length; i++) {
    var order = levels[i];
    if (bytes < cutoff*base || order == 'PB') {
      return sigFigs(bytes) + ' ' + order;
    }
    bytes /= 1024;
  }
}
Template.registerHelper("formatBytes", formatBytes);

shuffleBytesRead = function(shuffleReadMetrics) {
  return shuffleReadMetrics && (shuffleReadMetrics.LocalBytesRead + shuffleReadMetrics.RemoteBytesRead) || 0;;
};
Template.registerHelper("shuffleBytesRead", shuffleBytesRead);

shuffleBytesReadStr = function(shuffleReadMetrics) {
  return formatBytes(shuffleBytesRead(shuffleReadMetrics));
};
Template.registerHelper("shuffleBytesReadStr", shuffleBytesReadStr);

Template.registerHelper("formatDateTime", function(dt) {
  return dt && moment(dt).format("YYYY/MM/DD HH:mm:ss") || "-";
});

Template.registerHelper("shouldShow", function(a, b) { return a || b; });

formatDuration = function(start, end, hideIncomplete) {
  if (start && end)
    return formatTime(end - start);
  if (start && !hideIncomplete)
    return formatTime(moment().unix()*1000 - start) + '...';
  return "-";
};
Template.registerHelper("formatDuration", formatDuration);

