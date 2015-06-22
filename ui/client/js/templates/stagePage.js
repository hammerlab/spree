
var statuses = {
  undefined: "PENDING",
  1: "RUNNING",
  2: "SUCCESS",
  3: "FAILED",
  4: "SKIPPED"
};

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
    document.title = "Stage " + (data.stage && (data.stage.id !== undefined) ? data.stage.id : "-") + " (" + (data.stageAttempt && (data.stageAttempt.id !== undefined) ? data.stageAttempt.id : "-") + ")";
    return null;
  },

  totalTime: function(tasks) {
    var totalMs = 0;
    tasks.forEach(function(t) {
      totalMs += (t.time && t.time.start && t.time.end && (t.time.end - t.time.start)) || 0;
    });
    return formatTime(totalMs);
  },

  localityLevel: function(taskLocality) {
    return LocalityLevels[taskLocality];
  }
});

Template.stagePage.helpers(hases);
Template.metricsHeaders.helpers(hases);
Template.metricsColumns.helpers(hases);

Template.executorRow.helpers({
  taskTime: function(id) {
    var s = 0;
    TaskAttempts.find({execId: id}).forEach(function(t) {
      if (t.time && t.time.end && t.time.start)
        s += t.time.end - t.time.start;
    });
    return formatTime(s);
  },
  taskCounts: function(execId) {
    var stage = Stages.findOne();
    var stageId = stage && stage.id;
    var attempt = StageAttempts.findOne();
    var attemptId = attempt && attempt.id;
    var key = ['stages', stageId, attemptId, 'taskCounts'].join('.');
    var fields = {};
    fields[key] = 1;
    var e = Executors.findOne({ id: execId }, { fields: fields });
    return e && e.stages && e.stages[stageId] && e.stages[stageId][attemptId] && e.stages[stageId][attemptId].taskCounts || {};
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
Template.executorLostFailure.helpers({
  executorLostFailure: function(reason) {
    return reason == "ExecutorLostFailure"
  },
  getHostPort: function(execId) {
    var e = Executors.findOne({ id: execId });
    if (e) {
      return e.host + ':' + e.port;
    }
    return null;
  }
});

Template.summaryMetricsTable.helpers({
  numCompletedTasks: function(taskCounts) {
    console.log("numCompletedTasks: %O", taskCounts);
    return taskCounts && ((taskCounts.succeeded || 0) + (taskCounts.failed || 0));
  }
});

Template.tasksTable.helpers({
  status: function(task) {
    return statuses[task.status];
  },

  getHost: function(appId, execId) {
    // TODO(ryan): possibly inefficient on the critical path.
    var e = Executors.findOne({ appId: appId, id: execId });
    return e && e.host;
  }

});
