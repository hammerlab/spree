
sigFigs = function(m, n) {
  if (!m) return m;
  n = n || 3;
  var leftOfDecimal = Math.max(1, Math.ceil(Math.log(m) / Math.log(10)));
  return m.toFixed(Math.max(0, n - leftOfDecimal));
};

formatTime = function(ms, roundToSecond) {
  if (!ms) return '-';
  if (typeof ms != 'number') return ms;
  var S = 1000;
  var M = 60*S;
  var H = 60*M;
  var D = 24*H;

  if (ms < M) {
    if (ms < S) {
      if (roundToSecond === true) {
        return '<1 s';
      }
      return ms + ' ms';
    }
    if (roundToSecond === true) {
      return parseInt(ms / 1000) + ' s';
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

duration = function(x) { return x && x.time && (x.time.end - x.time.start) || 0; };

formatDateTime = function(dt) {
  return dt && moment(dt).format("YYYY/MM/DD HH:mm:ss") || "-";
};

formatBytesRatio = function(used, total) {
  var base = 1024;
  var cutoff = 2;
  var levels = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  var idx = 0;
  while (total > base && idx < levels.length) {
    used /= base;
    total /= base;
    idx++;
  }
  var order = levels[idx];
  return sigFigs(used) + '/' + sigFigs(total) + ' ' + order;
};

formatBytes = function(bytes) {
  if (!bytes) return "-";
  if (typeof bytes != 'number') return bytes;
  var base = 1024;
  var cutoff = 2;
  var levels = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  for (var i = 0; i < levels.length; i++) {
    var order = levels[i];
    if (bytes < cutoff*base || order == 'PB') {
      return sigFigs(bytes) + ' ' + order;
    }
    bytes /= base;
  }
};

formatPercent = (p) => {
  return (100*p).toString().substr(0, 3) + '%';
};

formatDuration = function(o) {
  if (o.time && o.time.start && !o.time.end) {
    return formatTime(TimeSync.serverTime(null, 10000) - o.time.start) + "…";
  }
  if (o.duration) {
    return formatTime(o.duration);
  }
  if (o.time && o.time.start && o.time.end) {
    return formatTime(o.time.end - o.time.start);
  }
  return '-';
};

getStorageLevel = function(sl) {
  return sl && [
          (sl.UseMemory ? "Memory" : (sl.UseExternalBlockStore ? "Tachyon" : (sl.UseDisk ? "Disk" : "???"))),
          sl.Deserialized ? "Deserialized" : "Serialized",
          sl.Replication + "x Replicated"
        ].join(" ") || null;
};
Template.registerHelper('getStorageLevel', getStorageLevel);

getHostPort = function(e) {
  if (typeof e == 'string') {
    e = Executors.findOne({id: e});
  }
  if (e) {
    return e.host + ':' + e.port;
  }
  return null;
};

renderers = {
  bytes: formatBytes,
  time: formatTime
};
defaultRenderer = (x) => { if (!x) return '-'; return x; };

