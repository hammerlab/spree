
function maybePrefix(prefix, suffix) {
  return prefix ? (prefix + '.' + suffix) : suffix;
}

taskColumns = (prefix) => {
  return [
    { id: 'activeTasks', label: 'Active Tasks', sortBy: maybePrefix(prefix, 'taskCounts.running') },
    { id: 'failedTasks', label: 'Failed Tasks', sortBy: maybePrefix(prefix, 'taskCounts.failed') },
    { id: 'completeTasks', label: 'Complete Tasks', sortBy: maybePrefix(prefix, 'taskCounts.succeeded') },
    { id: 'totalTasks', label: 'Total Tasks', sortBy: maybePrefix(prefix, 'taskCounts.num') }
  ];
};

inputBytesColumn = (prefix) => { return { id: 'input', label: 'Input', sortBy: maybePrefix(prefix, 'metrics.InputMetrics.BytesRead'), showInEmptyTable: false, render: formatBytes, defaultSort: -1 }; };
inputRecordsColumn = (prefix) => { return { id: 'inputRecords', label: 'Records', sortBy: maybePrefix(prefix, 'metrics.InputMetrics.RecordsRead'), showInEmptyTable: false, defaultSort: -1 }; };
outputBytesColumn = (prefix) => { return { id: 'output', label: 'Output', sortBy: maybePrefix(prefix, 'metrics.OutputMetrics.BytesWritten'), showInEmptyTable: false, render: formatBytes, defaultSort: -1 }; };
outputRecordsColumn = (prefix) => { return { id: 'outputRecords', label: 'Records', sortBy: maybePrefix(prefix, 'metrics.OutputMetrics.RecordsWritten'), showInEmptyTable: false, defaultSort: -1 }; };
shuffleReadBytesColumn = (prefix) => { return { id: 'shuffleRead', label: 'Shuffle Read', sortBy: maybePrefix(prefix, 'metrics.ShuffleReadMetrics.TotalBytesRead'), showInEmptyTable: false, render: formatBytes, defaultSort: -1 }; };
shuffleReadRecordsColumn = (prefix) => { return { id: 'shuffleReadRecords', label: 'Records', sortBy: maybePrefix(prefix, 'metrics.ShuffleReadMetrics.TotalRecordsRead'), showInEmptyTable: false, defaultSort: -1 }; };
shuffleWriteBytesColumn = (prefix) => { return { id: 'shuffleWrite', label: 'Shuffle Write', sortBy: maybePrefix(prefix, 'metrics.ShuffleWriteMetrics.ShuffleBytesWritten'), showInEmptyTable: false, render: formatBytes, defaultSort: -1 }; };
shuffleWriteRecordsColumn = (prefix) => { return { id: 'shuffleWriteRecords', label: 'Records', sortBy: maybePrefix(prefix, 'metrics.ShuffleWriteMetrics.ShuffleRecordsWritten'), showInEmptyTable: false, defaultSort: -1 }; };

ioBytesColumns = [
    inputBytesColumn,
    outputBytesColumn,
    shuffleReadBytesColumn,
    shuffleWriteBytesColumn
  ].map((fn) => fn());

ioColumns = (prefix) => {
  return [
    inputBytesColumn,
    inputRecordsColumn,
    outputBytesColumn,
    outputRecordsColumn,
    shuffleReadBytesColumn,
    shuffleReadRecordsColumn,
    shuffleWriteBytesColumn,
    shuffleWriteRecordsColumn
  ].map((fn) => fn(prefix));;
};

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
taskTimeColumn = (prefix) => {
  return {
    id: 'taskTime',
    label: 'Task Time',
    sortBy: (prefix ? (prefix + '.') : '') + 'metrics.ExecutorRunTime',
    render: formatTime,
    defaultSort: -1
  };
};
