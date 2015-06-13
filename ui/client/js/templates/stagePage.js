
var statuses = {
  undefined: "PENDING",
  1: "RUNNING",
  2: "SUCCEEDED",
  3: "FAILED",
  4: "SKIPPED"
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
    console.log("got e for %s %d.%d: %O", execId, stageId, attemptId, e);
    return e && e.stages && e.stages[stageId] && e.stages[stageId][attemptId] && e.stages[stageId][attemptId].taskCounts || {};
  }
});

Template.executorLostFailure.helpers({
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
    return taskCounts && (taskCounts.succeeded + taskCounts.failed) || 0;
  }
});

Template.tasksTable.helpers({
  status: function(task) {
    return statuses[task.status];
  },

  getHost: function(appId, execId/*task, appId, commonHostSuffix*/) {
    var e = Executors.findOne({ appId: appId, id: execId });
    return e && e.host;
  },

  lastMetrics: function(task) {
    return task.metrics && task.metrics[task.metrics.length - 1] || {};
  }

});
