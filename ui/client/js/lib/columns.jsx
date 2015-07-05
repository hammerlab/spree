
taskColumns = [
  { id: 'activeTasks', label: 'Active Tasks', sortBy: 'taskCounts.running' },
  { id: 'failedTasks', label: 'Failed Tasks', sortBy: 'taskCounts.failed' },
  { id: 'completeTasks', label: 'Complete Tasks', sortBy: 'taskCounts.succeeded' },
  { id: 'totalTasks', label: 'Total Tasks', sortBy: 'taskCounts.num' }
];

inputBytesColumn = { id: 'input', label: 'Input', sortBy: 'metrics.InputMetrics.BytesRead', showInEmptyTable: false, render: formatBytes, defaultSort: -1 };
inputRecordsColumn = { id: 'inputRecords', label: 'Records', sortBy: 'metrics.InputMetrics.RecordsRead', showInEmptyTable: false, defaultSort: -1 };
outputBytesColumn = { id: 'output', label: 'Output', sortBy: 'metrics.OutputMetrics.BytesWritten', showInEmptyTable: false, render: formatBytes, defaultSort: -1 };
outputRecordsColumn = { id: 'outputRecords', label: 'Records', sortBy: 'metrics.OutputMetrics.RecordsWritten', showInEmptyTable: false, defaultSort: -1 };
shuffleReadBytesColumn = { id: 'shuffleRead', label: 'Shuffle Read', sortBy: 'metrics.ShuffleReadMetrics.TotalBytesRead', showInEmptyTable: false, render: formatBytes, defaultSort: -1 };
shuffleReadRecordsColumn = { id: 'shuffleReadRecords', label: 'Records', sortBy: 'metrics.ShuffleReadMetrics.TotalRecordsRead', showInEmptyTable: false, defaultSort: -1 };
shuffleWriteBytesColumn = { id: 'shuffleWrite', label: 'Shuffle Write', sortBy: 'metrics.ShuffleWriteMetrics.ShuffleBytesWritten', showInEmptyTable: false, render: formatBytes, defaultSort: -1 };
shuffleWriteRecordsColumn = { id: 'shuffleWriteRecords', label: 'Records', sortBy: 'metrics.ShuffleWriteMetrics.ShuffleRecordsWritten', showInEmptyTable: false, defaultSort: -1 };

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

nameColumn = { id: 'name', label: 'Name', sortBy: 'name' };
startColumn = { label: 'Submitted', id: 'start', sortBy: 'time.start', render: formatDateTime, defaultSort: -1 };
durationColumn = { label: 'Duration', id: 'duration', sortBy: duration, render: formatTime, defaultSort: -1 };

function progressBar(counts) {
  return <ProgressBar counts={counts} />;
}
tasksColumn = { id: "tasks", label: "Tasks: Succeeded/Total", sortBy: "taskCounts.succeeded", render: progressBar, renderKey: 'taskCounts' };
stagesColumn = { id: "stages", label: "Stages: Succeeded/Total", sortBy: "stageCounts.succeeded", render: progressBar, renderKey: 'stageCounts' };

maxMemColumn = { id: 'maxMemSize', label: 'Max. Memory', sortBy: "maxMem", defaultSort: -1, render: formatBytes };
memColumn = { id: 'memSize', label: 'Size in Memory', sortBy: "MemorySize", defaultSort: -1, render: formatBytes };
offHeapColumn = { id: 'offHeapSize', label: 'Size in Tachyon', sortBy: "ExternalBlockStoreSize", defaultSort: -1, render: formatBytes };
diskColumn = { id: 'diskSize', label: 'Size on Disk', sortBy: "DiskSize", defaultSort: -1, render: formatBytes };

spaceColumns = [ memColumn, offHeapColumn, diskColumn ];

hostColumn = { id: 'host', label: 'Host', sortBy: 'host' };
portColumn = { id: 'port', label: 'Port', sortBy: 'port' };
numBlocksColumn = { id: 'blocks', label: 'RDD Blocks', sortBy: 'numBlocks', defaultSort: -1 };

storageLevelColumn = { id: 'storageLevel', label: 'Storage Level', sortBy: 'StorageLevel.UseMemory', render: getStorageLevel, renderKey: 'StorageLevel' };
taskTimeColumn = { id: 'taskTime', label: 'Task Time', sortBy: 'metrics.ExecutorRunTime', render: formatTime, defaultSort: -1 };
