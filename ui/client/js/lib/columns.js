
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
