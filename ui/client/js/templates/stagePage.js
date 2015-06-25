

var hases = {
  hasInput: function() {
    var stage = Stages.findOne();
    return stage && stage.metrics && stage.metrics.InputMetrics && stage.metrics.InputMetrics.BytesRead;
  },

  hasOutput: function() {
    var stage = Stages.findOne();
    return stage && stage.metrics && stage.metrics.OutputMetrics && stage.metrics.OutputMetrics.BytesWritten;
  },

  hasShuffleRead: function() {
    var stage = Stages.findOne();
    return stage && stage.metrics && shuffleBytesRead(stage.metrics.ShuffleReadMetrics);
  },

  hasShuffleWrite: function() {
    var stage = Stages.findOne();
    var ret = stage && stage.metrics && stage.metrics.ShuffleWriteMetrics && stage.metrics.ShuffleWriteMetrics.ShuffleBytesWritten;
    return !!ret;
  }

};

Template.stagePage.helpers({
  setTitle: function(data) {
    document.title = "Stage " + data.stageId + " (" + data.attemptId + ")";
    return null;
  }
});

Template.stagePage.helpers(hases);

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

Template.summaryMetricsTable.helpers({
  numCompletedTasks: function(taskCounts) {
    return taskCounts && ((taskCounts.succeeded || 0) + (taskCounts.failed || 0));
  }
});


// Per-executor table
var executorColumns = [
  { id: 'id', label: 'Executor ID', sortBy: 'id', template: 'id' },
  { id: 'address', label: 'Address', sortBy: getHostPort },
  { id: 'taskTime', label: 'Task Time', sortBy: 'metrics.ExecutorRunTime' }
]
      .concat(taskColumns)
      .concat(ioColumns);

makeTable(
      executorColumns, 'executorTable', 'sorted', 'columns', 'stageExec', 'stageExec', function() { return this.executors.map(identity); }, ['id', 1]
);


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

makeTable(
      columns, 'tasksTable', 'sorted', 'columns', 'taskRow', 'task', function() { return this.taskAttempts.map(identity); }, ['id', 1]
);

Template['taskRow-status'].helpers({
  status: function(task) {
    return statuses[task.status];
  }
});
