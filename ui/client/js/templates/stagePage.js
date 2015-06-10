
Template.stagePage.helpers({
  setTitle: function(data) {
    return "Stage " + data.stage.id + " (" + data.stage.attempt + ")";
  },

  totalTime: function(tasks) {
    var totalMs = 0;
    tasks.forEach(function(t) {
      totalMs += (t.time.end - t.time.start) || 0;
    });
    return formatTime(totalMs);
  },

  numCompletedTasks: function(taskCounts) {
    return taskCounts && (taskCounts.succeeded + taskCounts.failed) || 0;
  },

  status: function(task) {
    var started = !!(task.time.start || task.started);
    var ended = !!(task.time.end || task.ended);
    if (started && !ended) {
      return "RUNNING";
    }
    if (ended) {
      if (task.taskEndReason.tpe == 1)
        return "SUCCESS"
      return "FAILED";
    }
    if (!started)
      return "PENDING";
    return "";
  },

  localityLevel: function(taskLocality) {
    return LocalityLevels[taskLocality ];
  },

  lastMetrics: function(task) {
    return task.metrics && task.metrics[task.metrics.length - 1] || {};
  },

  getHost: function(task, appId, commonHostSuffix) {
    var e = Executors.findOne({ appId: appId, id: task.execId });
    return e && (commonHostSuffix ? e.host.substr(0, e.host.length - commonHostSuffix.length) : e.host) || "";
  },

  reason: function(taskEndReason) {
    return taskEndReason && TaskEndReasons[taskEndReason.tpe - 1] || "";
  },

  shouldShow: function(a, b) {
    return a || b;
  }
});

