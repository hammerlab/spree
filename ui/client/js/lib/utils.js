
TaskAttempts = new Mongo.Collection("task_attempts");
ETasks = new Mongo.Collection('etasks');
StageExecs = new Mongo.Collection('stage-execs');

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
  if (!ms) return '-';
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

formatDateTime = function(dt) {
  return dt && moment(dt).format("YYYY/MM/DD HH:mm:ss") || "-";
};
Template.registerHelper("formatDateTime", formatDateTime);

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

makeCmpFn = function(key) {
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

processColumns = function(originalColumns, tableName, templatePrefix) {
  var colsById = {};
  var columns = originalColumns.map(function(originalColumn) {
    var column = jQuery.extend({}, originalColumn);
    if (!column.sortBy) {
      throw new Error("Column " + column.id + " requires a 'sortBy' attribute");
    }
    if (!column.template && templatePrefix) {
      column.template = templatePrefix + '-' + column.id;
    }
    if (tableName) {
      column.tableName = tableName + '-table';
    }
    if (typeof column.sortBy == 'string') {
      column.sortKey = column.sortBy;
      column.sortBy = acc(column.sortBy);
    }
    column.cmpFn = function(a, b) {
      var fna = column.sortBy(a);
      var fnb = column.sortBy(b);
      if (fna < fnb || fna === undefined) return -1;
      if (fna > fnb || fnb === undefined) return 1;
      return 0;
    };

    colsById[column.id] = column;

    return column;
  });

  return {
    columns: columns,
    colsById: colsById
  };
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

  var columnsObj = processColumns(originalColumns, tableName, templatePrefix);
  var colsById = columnsObj.colsById;
  var columns = columnsObj.columns;

  var helpers = {};
  helpers[dataKey] = function(arg) {
    var sort = Session.get(tableName + '-table-sort') || defaultSort;
    //var sortObj = {};
    //sortObj[sort[0]] = sort[1];
    var sortColumn = colsById[sort[0]];
    var cmpFn = sortColumn.cmpFn;
    var arr = null;
    if (typeof data == 'string') {
      arr = this[data];
    } else {
      arr = this;
    }

    arr = arr.sort(cmpFn);
    if (sort[1] == -1) {
      arr = arr.reverse();
    }

    return arr;
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
  }, sl['Replication'] || 0);
};


taskColumns = [
  { id: 'activeTasks', label: 'Active Tasks', sortBy: 'taskCounts.running', template: 'activeTasks' },
  { id: 'failedTasks', label: 'Failed Tasks', sortBy: 'taskCounts.failed', template: 'failedTasks' },
  { id: 'completeTasks', label: 'Complete Tasks', sortBy: 'taskCounts.succeeded', template: 'completeTasks' },
  { id: 'totalTasks', label: 'Total Tasks', sortBy: 'taskCounts.num', template: 'totalTasks' }
];

inputBytesColumn = { id: 'input', label: 'Input', sortBy: 'metrics.InputMetrics.BytesRead', template: 'input', showInEmptyTable: false, render: formatBytes, defaultSort: -1 };
inputRecordsColumn = { id: 'inputRecords', label: 'Records', sortBy: 'metrics.InputMetrics.RecordsRead', template: 'inputRecords', showInEmptyTable: false, defaultSort: -1 };
outputBytesColumn = { id: 'output', label: 'Output', sortBy: 'metrics.OutputMetrics.BytesWritten', template: 'output', showInEmptyTable: false, render: formatBytes, defaultSort: -1 };
outputRecordsColumn = { id: 'outputRecords', label: 'Records', sortBy: 'metrics.OutputMetrics.RecordsWritten', template: 'outputRecords', showInEmptyTable: false, defaultSort: -1 };
shuffleReadBytesColumn = { id: 'shuffleRead', label: 'Shuffle Read', sortBy: 'metrics.ShuffleReadMetrics.TotalBytesRead', template: 'shuffleRead', showInEmptyTable: false, render: formatBytes, defaultSort: -1 };
shuffleReadRecordsColumn = { id: 'shuffleReadRecords', label: 'Records', sortBy: 'metrics.ShuffleReadMetrics.TotalRecordsRead', template: 'shuffleReadRecords', showInEmptyTable: false, defaultSort: -1 };
shuffleWriteBytesColumn = { id: 'shuffleWrite', label: 'Shuffle Write', sortBy: 'metrics.ShuffleWriteMetrics.ShuffleBytesWritten', template: 'shuffleWrite', showInEmptyTable: false, render: formatBytes, defaultSort: -1 };
shuffleWriteRecordsColumn = { id: 'shuffleWriteRecords', label: 'Records', sortBy: 'metrics.ShuffleWriteMetrics.ShuffleRecordsWritten', template: 'shuffleWriteRecords', showInEmptyTable: false, defaultSort: -1 };

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
startColumn = { label: 'Submitted', id: 'start', sortBy: 'time.start', template: 'start', render: formatDateTime, defaultSort: -1 };
durationColumn = { label: 'Duration', id: 'duration', sortBy: duration, template: 'duration', render: formatTime, defaultSort: -1 };
tasksColumn = { id: "tasks", label: "Tasks: Succeeded/Total", sortBy: "taskCounts.succeeded", template: 'tasks' };
stagesColumn = { id: "stages", label: "Stages: Succeeded/Total", sortBy: "stageCounts.succeeded", template: 'stages' };

memColumn = { id: 'memSize', label: 'Size in Memory', sortBy: "MemorySize", template: 'mem', defaultSort: -1 };
offHeapColumn = { id: 'offHeapSize', label: 'Size in Tachyon', sortBy: "ExternalBlockStoreSize", template: 'offHeap', defaultSort: -1 };
diskColumn = { id: 'diskSize', label: 'Size on Disk', sortBy: "DiskSize", template: 'disk', defaultSort: -1 };

spaceColumns = [ memColumn, offHeapColumn, diskColumn ];

hostColumn = { id: 'host', label: 'Host', sortBy: 'host', template: 'host' };
portColumn = { id: 'port', label: 'Port', sortBy: 'port', template: 'port' };
numBlocksColumn = { id: 'blocks', label: 'RDD Blocks', sortBy: 'numBlocks', template: 'numBlocks', defaultSort: -1 };

storageLevelColumn = { id: 'storageLevel', label: 'Storage Level', sortBy: 'StorageLevel.UseMemory', template: 'storageLevel' };
taskTimeColumn = { id: 'taskTime', label: 'Task Time', sortBy: 'metrics.ExecutorRunTime', template: 'taskTime', render: formatTime, defaultSort: -1 };
