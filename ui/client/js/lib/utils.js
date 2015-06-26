
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
  if (typeof ms != 'number') return ms;
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
Template.registerHelper("orDash", function(n) { return n || '-'; });
Template.registerHelper("orEmpty", function(n) { return n || {}; });

Template.registerHelper("formatDateTime", function(dt) {
  return dt && moment(dt).format("YYYY/MM/DD HH:mm:ss") || "-";
});

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
    bytes /= 1024;
  }
};
Template.registerHelper("formatBytes", formatBytes);

shuffleBytesRead = function(shuffleReadMetrics) {
  if (!shuffleReadMetrics) return 0;
  if ('metrics' in shuffleReadMetrics) shuffleReadMetrics = shuffleReadMetrics['metrics'];
  if ('ShuffleReadMetrics' in shuffleReadMetrics) shuffleReadMetrics = shuffleReadMetrics['ShuffleReadMetrics'];
  return shuffleReadMetrics && (shuffleReadMetrics.LocalBytesRead + shuffleReadMetrics.RemoteBytesRead) || 0;
};
Template.registerHelper("shuffleBytesRead", shuffleBytesRead);

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

byId = function(columns, templatePrefix, tableName) {
  var columnsById = {};
  columns.forEach(function(column) {
    column.template = column.template || (templatePrefix + '-' + column.id);
    column.table = tableName + '-table';
    if (!column.sortBy) {
      throw new Error("Column " + column.id + " requires a 'sortBy' attribute");
    }
    if (typeof column.sortBy == 'string') {
      column.sortBy = acc(column.sortBy);
    }
    column.cmpFn = function(a, b) {
      var fna = column.sortBy(a);
      var fnb = column.sortBy(b);
      if (fna < fnb || fna === undefined) return -1;
      if (fna > fnb || fnb === undefined) return 1;
      return 0;
    };
    columnsById[column.id] = column;
  });
  return columnsById;
};

makeTable = function(originalColumns, templateName, tableName, data, defaultSort, dataKey, columnsKey, templatePrefix) {
  if (!defaultSort) {
    if (!originalColumns.filter(function(c) { return c.id == 'id'; }).length) {
      throw new Error("Table " + tableName + " must specify a default sort value if 'id' column doesn't exist.");
    }
    defaultSort = ['id', 1];
  }

  dataKey = dataKey || 'sorted';
  columnsKey = columnsKey || 'columns';
  templatePrefix = templatePrefix || (tableName + 'Row');

  var columns = originalColumns.map(function(col) { return jQuery.extend({}, col); });
  var columnsById = byId(columns, templatePrefix, tableName);

  var helpers = {};
  helpers[dataKey] = function(arg) {
    var sort = Session.get(tableName + '-table-sort') || defaultSort;
    var cmpFn = columnsById[sort[0]].cmpFn;
    data = (
          (!data ?
                      this :
                      ((typeof data == 'function') ?
                                  data.bind(this).call(this, arg) :
                                  ((data instanceof Array) ?
                                              data :
                                              ((typeof data == 'string') ?
                                                          this[data].map(identity) :
                                                          data.map(identity)
                                              )

                                  )
                      )
          )
    );
    return (sort[1] == 1 ? data.sort(cmpFn) : data.sort(cmpFn).reverse());
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
  if ('StorageLevel' in sl) sl = sl['StorageLevel'];
  return ['UseMemory', 'UseExternalBlockStore', 'UseDisk', 'Deserialized'].reduce(function(s, e) {
    return 2*s + sl[e]
  }, sl['Replication']);
};


taskColumns = [
  { id: 'activeTasks', label: 'Active Tasks', sortBy: 'taskCounts.running', template: 'activeTasks' },
  { id: 'failedTasks', label: 'Failed Tasks', sortBy: 'taskCounts.failed', template: 'failedTasks' },
  { id: 'completeTasks', label: 'Complete Tasks', sortBy: 'taskCounts.succeeded', template: 'completeTasks' },
  { id: 'totalTasks', label: 'Total Tasks', sortBy: 'taskCounts.num', template: 'totalTasks' }
];

inputBytesColumn = { id: 'input', label: 'Input', sortBy: 'metrics.InputMetrics.BytesRead', template: 'input', showInEmptyTable: false };
inputRecordsColumn = { id: 'inputRecords', label: 'Records', sortBy: 'metrics.InputMetrics.RecordsRead', template: 'inputRecords', showInEmptyTable: false };
outputBytesColumn = { id: 'output', label: 'Output', sortBy: 'metrics.OutputMetrics.BytesWritten', template: 'output', showInEmptyTable: false };
outputRecordsColumn = { id: 'outputRecords', label: 'Records', sortBy: 'metrics.OutputMetrics.RecordsWritten', template: 'outputRecords', showInEmptyTable: false };
shuffleReadBytesColumn = { id: 'shuffleRead', label: 'Shuffle Read', sortBy: function(x) { return x.metrics && shuffleBytesRead(x.metrics.ShuffleReadMetrics) || 0; }, template: 'shuffleRead', showInEmptyTable: false };
shuffleReadRecordsColumn = { id: 'shuffleReadRecords', label: 'Records', sortBy: 'metrics.ShuffleReadMetrics.TotalRecordsRead', template: 'shuffleReadRecords', showInEmptyTable: false };
shuffleWriteBytesColumn = { id: 'shuffleWrite', label: 'Shuffle Write', sortBy: 'metrics.ShuffleWriteMetrics.ShuffleBytesWritten', template: 'shuffleWrite', showInEmptyTable: false };
shuffleWriteRecordsColumn = { id: 'shuffleWriteRecords', label: 'Records', sortBy: 'metrics.ShuffleWriteMetrics.ShuffleRecordsWritten', template: 'shuffleWriteRecords', showInEmptyTable: false };

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

duration = function(x) { return x && x.time && (x.time.end - x.time.start) || 0; };

nameColumn = { id: 'name', label: 'Name', sortBy: 'name', template: 'nameAttr' };
startColumn = { label: 'Submitted', id: 'start', sortBy: 'time.start', template: 'start' };
durationColumn = { label: 'Duration', id: 'duration', sortBy: duration, template: 'duration' };
tasksColumn = { id: "tasks", label: "Tasks: Succeeded/Total", sortBy: "taskCounts.succeeded", template: 'tasks' };
stagesColumn = { id: "stages", label: "Stages: Succeeded/Total", sortBy: "stageCounts.succeeded", template: 'stages' };

memColumn = { id: 'memSize', label: 'Size in Memory', sortBy: "MemorySize", template: 'mem' };
offHeapColumn = { id: 'offHeapSize', label: 'Size in Tachyon', sortBy: "ExternalBlockStoreSize", template: 'offHeap' };
diskColumn = { id: 'diskSize', label: 'Size on Disk', sortBy: "DiskSize", template: 'disk' };

spaceColumns = [ memColumn, offHeapColumn, diskColumn ];

hostColumn = { id: 'host', label: 'Host', sortBy: 'host', template: 'host' };
portColumn = { id: 'port', label: 'Port', sortBy: 'port', template: 'port' };
numBlocksColumn = { id: 'blocks', label: 'RDD Blocks', sortBy: 'numBlocks', template: 'numBlocks' };

storageLevelColumn = { id: 'storageLevel', label: 'Storage Level', sortBy: storageLevelToNum, template: 'storageLevel' };
taskTimeColumn = { id: 'taskTime', label: 'Task Time', sortBy: 'metrics.ExecutorRunTime', template: 'taskTime' };
