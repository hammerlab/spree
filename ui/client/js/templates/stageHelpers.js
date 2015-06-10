
completedStages = function() {
  return Stages.find({
    $or: [
      { ended: true },
      { skipped: true },
      { "time.end": { $exists: true }}
    ]
  }, { sort: { id: -1 }});
};
Template.registerHelper("completedStages", completedStages);
Template.registerHelper("numCompletedStages", function() {
  return completedStages().count();
});

activeStages = function() {
  return Stages.find({
    $or: [
      { started: true },
      { "time.start": { $exists: true } }
    ],
    ended: { $not: true },
    skipped: { $not: true },
    "time.end": { $exists: false }
  }, { sort: { id: -1 }});
};
Template.registerHelper("activeStages", activeStages);
Template.registerHelper("numActiveStages", function() {
  return activeStages().count();
});

pendingStages = function() {
  return Stages.find({
    started: { $not: true },
    "time.start": { $exists: false },
    ended: { $not: true },
    skipped: { $not: true },
    "time.end": { $exists: false }
  }, { sort: { id: -1 }});
};
Template.registerHelper("pendingStages", pendingStages);
Template.registerHelper("numPendingStages", function() {
  return pendingStages().count();
});

skippedStages = function() {
  return Stages.find({
    skipped: true
  });
};
Template.registerHelper("skippedStages", skippedStages);
Template.registerHelper("numSkippedStages", function() {
  return skippedStages().count();
});

Template.stageRow.helpers({
  getClass: function(stage) {
    if (!stage) return "";
    if (stage.failureReason) {
      return "failed"
    }
    if (stage.time && stage.time.end) {
      return "succeeded";
    }
    return "";
  },
  shuffleRead: function(shuffleReadMetrics) {
    return shuffleReadMetrics && formatBytes(shuffleReadMetrics.localBytesRead + shuffleReadMetrics.remoteBytesRead) || "";
  }
});

