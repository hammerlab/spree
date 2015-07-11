
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
  }

  if (this.renderKey !== undefined) {
    this.renderValueFn = acc(this.renderKey);
  }

  this.prefix = function(prefix) {
    return new Column(
          id,
          label,
          prefix ?
                this.sortKeys.map((key) => { return prefix + '.' + key; }) :
                this.sortKeys,
          opts
    );
  }
};

taskColumns = [
  new Column('activeTasks', 'Active Tasks', 'taskCounts.running'),
  new Column('failedTasks', 'Failed Tasks', 'taskCounts.failed'),
  new Column('completeTasks', 'Complete Tasks', 'taskCounts.succeeded'),
  new Column('totalTasks', 'Total Tasks', 'taskCounts.num')
];

inputBytesColumn = new Column('input', 'Input', 'metrics.InputMetrics.BytesRead', { showInEmptyTable: false, render: formatBytes, defaultSort: -1 });
inputRecordsColumn = new Column('inputRecords', 'Records', 'metrics.InputMetrics.RecordsRead', { showInEmptyTable: false, defaultSort: -1 });
outputBytesColumn = new Column('output', 'Output', 'metrics.OutputMetrics.BytesWritten', { showInEmptyTable: false, render: formatBytes, defaultSort: -1 });
outputRecordsColumn = new Column('outputRecords', 'Records', 'metrics.OutputMetrics.RecordsWritten', { showInEmptyTable: false, defaultSort: -1 });
shuffleReadBytesColumn = new Column('shuffleRead', 'Shuffle Read', 'metrics.ShuffleReadMetrics.TotalBytesRead', { showInEmptyTable: false, render: formatBytes, defaultSort: -1 });
shuffleReadRecordsColumn = new Column('shuffleReadRecords', 'Records', 'metrics.ShuffleReadMetrics.TotalRecordsRead', { showInEmptyTable: false, defaultSort: -1 });
shuffleWriteBytesColumn = new Column('shuffleWrite', 'Shuffle Write', 'metrics.ShuffleWriteMetrics.ShuffleBytesWritten', { showInEmptyTable: false, render: formatBytes, defaultSort: -1 });
shuffleWriteRecordsColumn = new Column('shuffleWriteRecords', 'Records', 'metrics.ShuffleWriteMetrics.ShuffleRecordsWritten', { showInEmptyTable: false, defaultSort: -1 });

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

nameColumn = new Column('name', 'Name', 'name', {  });
startColumn = new Column('start', 'Submitted', 'time.start', { render: formatDateTime, defaultSort: -1 });
durationColumn = new Column('duration', 'Duration', 'duration', { render: formatTime, defaultSort: -1 });

function progressBar(counts) {
  return <ProgressBar counts={counts} />;
}
tasksColumn = new Column('tasks', 'Tasks Attempts', 'taskCounts.succeeded', { render: progressBar, renderKey: 'taskCounts', showByDefault: false });
taskIdxsColumn = new Column('tasksIdxs', 'Tasks: Succeeded/Total', 'taskIdxCounts.succeeded', { render: progressBar, renderKey: 'taskIdxCounts' });
stagesColumn = new Column('stages', 'Stages: Succeeded/Total', 'stageCounts.succeeded', { render: progressBar, renderKey: 'stageCounts' });

maxMemColumn = new Column('maxMemSize', 'Max. Memory', 'maxMem', { defaultSort: -1, render: formatBytes });
memColumn = new Column('memSize', 'Size in Memory', 'MemorySize', { defaultSort: -1, render: formatBytes });
offHeapColumn = new Column('offHeapSize', 'Size in Tachyon', 'ExternalBlockStoreSize', { defaultSort: -1, render: formatBytes });
diskColumn = new Column('diskSize', 'Size on Disk', 'DiskSize', { defaultSort: -1, render: formatBytes });

spaceColumns = [ memColumn, offHeapColumn, diskColumn ];

hostColumn = new Column('host', 'Host', 'host', {  });
portColumn = new Column('port', 'Port', 'port', {  });
numBlocksColumn = new Column('blocks', 'RDD Blocks', 'numBlocks', { defaultSort: -1 });

storageLevelColumn = new Column('storageLevel', 'Storage Level', 'StorageLevel.UseMemory', { render: getStorageLevel, renderKey: 'StorageLevel' });
taskTimeColumn = new Column('taskTime', 'Task Time', 'metrics.ExecutorRunTime', { render: formatTime, defaultSort: -1 });
