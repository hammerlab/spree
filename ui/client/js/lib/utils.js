
PENDING = undefined;
RUNNING = 1;
SUCCEEDED = 2;
FAILED = 3;
SKIPPED = 4;

statuses = {
  undefined: "PENDING",
  1: "RUNNING",
  2: "SUCCESS",
  3: "FAILED",
  4: "SKIPPED"
};


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
};
Template.registerHelper("formatBytes", formatBytes);

shuffleBytesRead = function(shuffleReadMetrics) {
  return shuffleReadMetrics && (shuffleReadMetrics.LocalBytesRead + shuffleReadMetrics.RemoteBytesRead) || 0;
};
Template.registerHelper("shuffleBytesRead", shuffleBytesRead);

shuffleBytesReadCmp = function(key) {
  var f = acc(key);
  return function(a,b) {
    return shuffleBytesRead(f(a).metrics.ShuffleReadMetrics) - shuffleBytesRead(f(b).metrics.ShuffleReadMetrics);
  };
};

shuffleBytesReadStr = function(shuffleReadMetrics) {
  return formatBytes(shuffleBytesRead(shuffleReadMetrics));
};
Template.registerHelper("shuffleBytesReadStr", shuffleBytesReadStr);

Template.registerHelper("formatDateTime", function(dt) {
  return dt && moment(dt).format("YYYY/MM/DD HH:mm:ss") || "-";
});

Template.registerHelper('first', function(data) { return data[0]; });
Template.registerHelper('second', function(data) { return data[1]; });

formatDuration = function(start, end, hideIncomplete) {
  if (start && end)
    return formatTime(end - start);
  if (start && !hideIncomplete)
    return formatTime(moment().unix()*1000 - start) + '...';
  return "-";
};
Template.registerHelper("formatDuration", formatDuration);

acc = function(key) {
  if (!key) {
    return identity;
  }
  if (typeof key == 'string') {
    return acc(key.split('.'));
  }
  return key.reduce(function(soFar, next) {
    return function(x) {
      var sf = soFar(x);
      return sf ? sf[next] : undefined;
    };
  }, function(x) { return x; });
};

sortBy = function(key) {
  var fn = null;
  if (typeof key == 'function') {
    fn = key;
  } else if (typeof key == 'string') {
    fn = acc(key);
  } else {
    throw new Error("Can't sort by: " + key);
  }
  return function(a, b) {
    var fna = fn(a);
    var fnb = fn(b);
    if (fna < fnb || fna === undefined) return -1;
    if (fna > fnb || fnb === undefined) return 1;
    return 0;
  }
};

identity = function(x) { return x; };

durationCmp = function(key) {
  var f = acc(key);
  return function(a, b) {
    var A = (f(a).time.end - f(a).time.start) || 0;
    var B = (f(b).time.end - f(b).time.start) || 0;
    if (A < B) return -1;
    if (A > B) return 1;
    return 0;
  };
};

byId = function(columns, templatePrefix, tableName) {
  var columnsById = {};
  columns.forEach(function(column) {
    column.template = column.template || (templatePrefix + '-' + column.id);
    column.table = tableName + '-table';
    columnsById[column.id] = column;
  });
  return columnsById;
};

makeTable = function(originalColumns, templateName, dataKey, columnsKey, templatePrefix, tableName, dataFn, defaultSort) {
  var columns = originalColumns.map(function(col) { return jQuery.extend({}, col); });
  var columnsById = byId(columns, templatePrefix, tableName);

  var helpers = {};
  helpers[dataKey] = function(arg) {
    var sort = Session.get(tableName + '-table-sort') || defaultSort;
    var cmpFn = columnsById[sort[0]].cmpFn;
    var data = dataFn.bind(this).call(this, arg);
    return (
          cmpFn ?
                (sort[1] == 1 ? data.sort(cmpFn) : data.sort(cmpFn).reverse()) :
                (sort[1] == 1 ? data.sort() : data.sort().reverse())
    );
  };
  helpers[columnsKey] = columns;

  Template[templateName].helpers(helpers);
};


getStorageLevel = function(sl) {
  return sl && [
          (sl.UseMemory ? "Memory" : (sl.UseExternalBlockStore ? "Tachyon" : (sl.UseDisk ? "Disk" : "???"))),
          sl.Deserialized ? "Deserialized" : "Serialized",
          sl.Replication + "x Replicated"
        ].join(" ") || null;
};
Template.registerHelper('getStorageLevel', getStorageLevel);

storageLevelToNum = function(sl) {
  return ['UseMemory', 'UseExternalBlockStore', 'UseDisk', 'Deserialized'].reduce(function(s, e) {
    return 2*s + sl[e]
  }, sl['Replication']);
};


taskColumns = [
  { id: 'activeTasks', label: 'Active Tasks', cmpFn: sortBy('taskCounts.running'), template: 'activeTasks' },
  { id: 'failedTasks', label: 'Failed Tasks', cmpFn: sortBy('taskCounts.failed'), template: 'failedTasks' },
  { id: 'completeTasks', label: 'Complete Tasks', cmpFn: sortBy('taskCounts.succeeded'), template: 'completeTasks' },
  { id: 'totalTasks', label: 'Total Tasks', cmpFn: sortBy('taskCounts.num'), template: 'totalTasks' }
];

inputBytesColumn = { id: 'input', label: 'Input', cmpFn: sortBy('metrics.InputMetrics.BytesRead'), template: 'input' };
inputRecordsColumn = { id: 'inputRecords', label: 'Records', cmpFn: sortBy('metrics.InputMetrics.RecordsRead'), template: 'inputRecords' };
outputBytesColumn = { id: 'output', label: 'Output', cmpFn: sortBy('metrics.OutputMetrics.BytesWritten'), template: 'output' };
outputRecordsColumn = { id: 'outputRecords', label: 'Records', cmpFn: sortBy('metrics.OutputMetrics.RecordsWritten'), template: 'outputRecords' };
shuffleReadBytesColumn = { id: 'shuffleRead', label: 'Shuffle Read', cmpFn: shuffleBytesReadCmp(), template: 'shuffleRead' };
shuffleReadRecordsColumn = { id: 'shuffleReadRecords', label: 'Records', cmpFn: sortBy('metrics.ShuffleReadMetrics.TotalRecordsRead'), template: 'shuffleReadRecords' };
shuffleWriteBytesColumn = { id: 'shuffleWrite', label: 'Shuffle Write', cmpFn: sortBy('metrics.ShuffleWriteMetrics.ShuffleBytesWritten'), template: 'shuffleWrite' };
shuffleWriteRecordsColumn = { id: 'shuffleWriteRecords', label: 'Records', cmpFn: sortBy('metrics.ShuffleWriteMetrics.ShuffleRecordsWritten'), template: 'shuffleWriteRecords' };

ioBytesColumns = [
  inputBytesColumn,
  outputBytesColumn,
  shuffleReadBytesColumn,
  shuffleWriteBytesColumn
];

ioColumns = [
  inputBytesColumn,
  inputRecordsColumn,
  outputBytesColumn,
  outputRecordsColumn,
  shuffleReadBytesColumn,
  shuffleReadRecordsColumn,
  shuffleWriteBytesColumn,
  shuffleWriteRecordsColumn
];

nameColumn = { id: 'name', label: 'Name', cmpFn: sortBy('name'), template: 'nameAttr' };
startColumn = { label: 'Submitted', id: 'start', cmpFn: sortBy('time.start'), template: 'start' };
durationColumn = { label: 'Duration', id: 'duration', cmpFn: durationCmp(), template: 'duration' };
tasksColumn = { id: "tasks", label: "Tasks: Succeeded/Total", cmpFn: sortBy("taskCounts.succeeded"), template: 'tasks' };
stagesColumn = { id: "stages", label: "Stages: Succeeded/Total", cmpFn: sortBy("stageCounts.succeeded"), template: 'stages' };

memColumn = { id: 'memSize', label: 'Size in Memory', cmpFn: sortBy("MemorySize"), template: 'mem' };
offHeapColumn = { id: 'offHeapSize', label: 'Size in Tachyon', cmpFn: sortBy("ExternalBlockStoreSize"), template: 'offHeap' };
diskColumn = { id: 'diskSize', label: 'Size on Disk', cmpFn: sortBy("DiskSize"), template: 'disk' };

spaceColumns = [ memColumn, offHeapColumn, diskColumn ];

hostColumn = { id: 'host', label: 'Host', cmpFn: sortBy('host'), template: 'host' };
portColumn = { id: 'port', label: 'Port', cmpFn: sortBy('port'), template: 'port' };
numBlocksColumn = { id: 'blocks', label: 'RDD Blocks', cmpFn: sortBy('numBlocks'), template: 'numBlocks' };

storageLevelColumn = { id: 'storageLevel', label: 'Storage Level', cmpFn: sortBy(storageLevelToNum), template: 'storageLevel' };
