
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

  numCompletedTasks: function(taskCounts) {
    return taskCounts && (taskCounts.succeeded + taskCounts.failed) || 0;
  },

  status: function(task) {
    return statuses[task.status];
  },

  localityLevel: function(taskLocality) {
    return LocalityLevels[taskLocality];
  },

  lastMetrics: function(task) {
    return task.metrics && task.metrics[task.metrics.length - 1] || {};
  },

  getHost: function(appId, execId/*task, appId, commonHostSuffix*/) {
    var e = Executors.findOne({ appId: appId, id: execId });
    return e && e.host;
  },

  reason: function(taskEndReason) {
    return taskEndReason && TaskEndReasons[taskEndReason.tpe - 1] || "";
  },

  shouldShow: function(a, b) {
    return a || b;
  }

});

