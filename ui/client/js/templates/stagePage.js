

Template.stagePage.helpers({
  setTitle: function(data) {
    document.title = "Stage " + data.stageId + " (" + data.attemptId + ")";
    return null;
  }
});

Template.exceptionFailure.helpers({
  exceptionFailure: function(reason) {
    return reason == "ExceptionFailure"
  }
});
Template.fetchFailure.helpers({
  fetchFailure: function(reason) {
    return reason == "FetchFailure"
  }
});

getHostPort = function(execId) {
  var e = Executors.findOne({ id: execId });
  if (e) {
    return e.host + ':' + e.port;
  }
  return null;
};

Template.executorLostFailure.helpers({
  executorLostFailure: function(reason) {
    return reason == "ExecutorLostFailure"
  },
  getHostPort: getHostPort
});

Template.summaryStatsTable.helpers({
  numCompletedTasks: function(taskCounts) {
    return taskCounts && ((taskCounts.succeeded || 0) + (taskCounts.failed || 0));
  }
});

var statsColumns = [
  { id: 'id', label: 'Metric', sortBy: 'id', template: 'id' },
  { id: 'min', label: 'Min', sortBy: 'min' },
  { id: 'tf', label: '25th Percentile', sortBy: 'tf' },
  { id: 'median', label: 'Median', sortBy: 'median' },
  { id: 'sf', label: '75th Percentile', sortBy: 'sf' },
  { id: 'max', label: 'Max', sortBy: 'max' }
];

makeTable(statsColumns, 'summaryStatsTable', 'summaryStats', 'stats');

// Per-executor table
var executorColumns = [
  { id: 'id', label: 'Executor ID', sortBy: 'id', template: 'id' },
  { id: 'address', label: 'Address', sortBy: getHostPort },
  taskTimeColumn
]
      .concat(taskColumns)
      .concat(ioColumns);

makeTable(executorColumns, 'executorTable', 'stageExec', 'executors');


// Per-task table
var columns = [
  { id: 'index', label: 'Index', sortBy: 'index' },
  { id: 'id', label: 'ID', sortBy: 'id', template: 'id' },
  { id: 'attempt', label: 'Attempt', sortBy: 'attempt' },
  { id: 'status', label: 'Status', sortBy: 'status' },
  { id: 'localityLevel', label: 'Locality Level', sortBy: 'locality' },
  { id: 'execId', label: 'Executor', sortBy: 'execId' },
  { id: 'host', label: 'Host', sortBy: 'host', template: 'host' },
  startColumn,
  durationColumn,
  { id: 'gcTime', label: 'GC Time', sortBy: 'metrics.JVMGCTime' }
]
      .concat(ioColumns)
      .concat([
        { id: 'errors', label: 'Errors', sortBy: 'errors' }
      ]);

makeTable(columns, 'tasksTable', 'task', 'taskAttempts');

Template['taskRow-status'].helpers({
  status: function(task) {
    return statuses[task.status];
  }
});
