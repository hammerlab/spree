
Column = function(id, label, sortKeys, opts) {
  this.id = id;
  this.label = label;
  if (typeof sortKeys === 'string') {
    this.sortKeys = [ sortKeys ];
  } else if (sortKeys instanceof Array) {
    this.sortKeys = sortKeys;
  } else {
    throw new Error("Invalid sort keys: ", sortKeys);
  }
  this.sortBys = this.sortKeys.map(function(key) { return acc(key); });

  this.cmpFn = function(a, b) {
    for (var i = 0; i < this.sortBys.length; i++) {
      var fna = this.sortBys[i](a);
      var fnb = this.sortBys[i](b);
      if (fna < fnb || fna === undefined) return -1;
      if (fna > fnb || fnb === undefined) return 1;
    }
    return 0;
  }.bind(this);

  if (opts) {
    this.showInEmptyTable = opts.showInEmptyTable;
    this.render = opts.render;
    this.renderKey = opts.renderKey;
    this.defaultSort = opts.defaultSort;
    this.truthyZero = opts.truthyZero;
    this.showByDefault = opts.showByDefault;
    this.requireOracle = opts.requireOracle;
  }

  if (this.renderKey !== undefined) {
    this.renderValueFn = acc(this.renderKey);
  }
};

taskColumns = [
  new Column('activeTasks', 'Active Tasks', 'taskCounts.running', { defaultSort: -1, render: defaultRenderer }),
  new Column('failedTasks', 'Failed Tasks', 'taskCounts.failed', { defaultSort: -1, render: defaultRenderer }),
  new Column('completeTasks', 'Complete Tasks', 'taskCounts.succeeded', { defaultSort: -1, render: defaultRenderer }),
  new Column('totalTasks', 'Total Tasks', 'taskCounts.num', { defaultSort: -1, render: defaultRenderer })
];

inputBytesColumn = new Column('input', 'Input', 'metrics.InputMetrics.BytesRead', { showInEmptyTable: false, render: formatBytes, defaultSort: -1, requireOracle: true });
inputRecordsColumn = new Column('inputRecords', 'Records', 'metrics.InputMetrics.RecordsRead', { showInEmptyTable: false, render: defaultRenderer, defaultSort: -1, requireOracle: true });
outputBytesColumn = new Column('output', 'Output', 'metrics.OutputMetrics.BytesWritten', { showInEmptyTable: false, render: formatBytes, defaultSort: -1, requireOracle: true });
outputRecordsColumn = new Column('outputRecords', 'Records', 'metrics.OutputMetrics.RecordsWritten', { showInEmptyTable: false, render: defaultRenderer, defaultSort: -1, requireOracle: true });
shuffleReadBytesColumn = new Column('shuffleRead', 'Shuffle Read', 'metrics.ShuffleReadMetrics.TotalBytesRead', { showInEmptyTable: false, render: formatBytes, defaultSort: -1, requireOracle: true });
shuffleReadRecordsColumn = new Column('shuffleReadRecords', 'Records', 'metrics.ShuffleReadMetrics.TotalRecordsRead', { showInEmptyTable: false, render: defaultRenderer, defaultSort: -1, requireOracle: true });
shuffleWriteBytesColumn = new Column('shuffleWrite', 'Shuffle Write', 'metrics.ShuffleWriteMetrics.ShuffleBytesWritten', { showInEmptyTable: false, render: formatBytes, defaultSort: -1, requireOracle: true });
shuffleWriteRecordsColumn = new Column('shuffleWriteRecords', 'Records', 'metrics.ShuffleWriteMetrics.ShuffleRecordsWritten', { showInEmptyTable: false, render: defaultRenderer, defaultSort: -1, requireOracle: true });

var memorySpillColumn = new Column('spillMem', 'Memory Spilled', 'metrics.MemoryBytesSpilled', { render: formatBytes, requireOracle: true });
var diskSpillColumn = new Column('spillDisk', 'Disk Spilled', 'metrics.DiskBytesSpilled', { render: formatBytes, requireOracle: true });

ioColumns = [
  inputBytesColumn,
  inputRecordsColumn,
  outputBytesColumn,
  outputRecordsColumn,
  shuffleReadBytesColumn,
  shuffleReadRecordsColumn,
  shuffleWriteBytesColumn,
  shuffleWriteRecordsColumn,
  memorySpillColumn,
  diskSpillColumn
];

nameColumn = new Column('name', 'Name', 'name', {  });
startColumn = new Column('start', 'Started', 'time.start', { render: formatDateTime, defaultSort: -1 });
endColumn = new Column(
      'end',
      'Ended',
      'time.end',
      {
        render: formatDateTime,
        defaultSort: -1,
        requireOracle: (app) => { return app.executorCounts && app.executorCounts.removed; }
      }
);
durationColumn = new Column(
      'duration',
      'Duration',
      'duration',
      {
        render: formatDuration,
        renderKey: '',
        defaultSort: -1
      }
);

function progressBar(counts) {
  return <ProgressBar counts={counts} />;
}
tasksColumn = new Column(
      'tasks',
      'Tasks Attempts: Succeeded/Total',
      'taskCounts.succeeded',
      {
        render: progressBar,
        renderKey: 'taskCounts',
        showByDefault: false,
        truthyZero: true
      }
);
taskIdxsColumn = new Column(
      'tasksIdxs',
      'Tasks: Succeeded/Total',
      'taskIdxCounts.succeeded',
      {
        render: progressBar,
        renderKey: 'taskIdxCounts',
        truthyZero: true
      }
);
stagesColumn = new Column(
      'stages',
      'Stage attempts: Succeeded/Total',
      'stageCounts.succeeded',
      {
        render: progressBar,
        renderKey: 'stageCounts',
        showByDefault: false,
        truthyZero: true
      }
);
stageIdxsColumn = new Column(
      'stagesIdxs',
      'Stages: Succeeded/Total',
      'stageIdxCounts.succeeded',
      {
        render: progressBar,
        renderKey: 'stageIdxCounts',
        truthyZero: true
      }
);

gcColumn = new Column('gcTime', 'GC Time', 'metrics.JVMGCTime', { showInEmptyTable: false, render: formatTime, defaultSort: -1, requireOracle: true });
maxMemColumn = new Column('maxMemSize', 'Max. Memory', 'maxMem', { defaultSort: -1, render: formatBytes });
memColumn = new Column('memSize', 'Size in Memory', 'MemorySize', { defaultSort: -1, render: formatBytes, requireOracle: true });
offHeapColumn = new Column('offHeapSize', 'Size in Tachyon', 'ExternalBlockStoreSize', { defaultSort: -1, render: formatBytes, requireOracle: true });
diskColumn = new Column('diskSize', 'Size on Disk', 'DiskSize', { defaultSort: -1, render: formatBytes, requireOracle: true });

reasonColumn = new Column(
      'reason',
      'Removed Reason',
      'reason',
      {
        showInEmptyTable: false,
        requireOracle: (app) => { return app.executorCounts && app.executorCounts.removed; }
      }
);
spaceColumns = [ memColumn, offHeapColumn, diskColumn ];

blockIdColumn = new Column('id', 'Block ID', 'id', { truthyZero: true });
executorIdColumn = new Column('eid', 'Executor ID', 'execId', { truthyZero: true });
hostColumn = new Column('host', 'Host', 'host');
portColumn = new Column('port', 'Port', 'port', { showByDefault: false });
numBlocksColumn = new Column('blocks', 'RDD Blocks', 'numBlocks', { defaultSort: -1 });

storageLevelColumn = new Column('storageLevel', 'Storage Level', 'StorageLevel.UseMemory', { render: getStorageLevel, renderKey: 'StorageLevel' });
taskTimeColumn = new Column('taskTime', 'Task Time', 'metrics.ExecutorRunTime', { render: formatTime, defaultSort: -1 });

lastUpdatedColumn = new Column(
      'lastUpdated',
      'Last Updated',
      'l',
      {
        render: (t) => {
          var ms = TimeSync.serverTime(null, 10000) - t;
          return formatTime(ms, true) + " ago";
        }
      }
);
