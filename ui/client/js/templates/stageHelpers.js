
attachStagesToAttempts = function(attempts) {
  return attempts.map(function(stageAttempt) {
    return { attempt: stageAttempt, stage: Stages.findOne({ id: stageAttempt.stageId }) };
  });
};

completedStages = function() {
  return StageAttempts.find({
    $or: [
      { ended: true },
      { skipped: true },
      { "time.end": { $exists: true }}
    ]
  }, { sort: { stageId: -1 }});
};
Template.registerHelper("completedStages", function() { return attachStagesToAttempts(completedStages()); });
Template.registerHelper("numCompletedStages", function() {
  return completedStages().count();
});

activeStages = function() {
  return StageAttempts.find({
    $or: [
      { started: true },
      { "time.start": { $exists: true } }
    ],
    ended: { $not: true },
    skipped: { $not: true },
    "time.end": { $exists: false }
  }, { sort: { stageId: -1 }});
};
Template.registerHelper("activeStages", function() { return attachStagesToAttempts(activeStages()); });
Template.registerHelper("numActiveStages", function() {
  return activeStages().count();
});

pendingStages = function() {
  return StageAttempts.find({
    started: { $not: true },
    "time.start": { $exists: false },
    ended: { $not: true },
    skipped: { $not: true },
    "time.end": { $exists: false }
  }, { sort: { stageId: -1 }});
};
Template.registerHelper("pendingStages", function() { return attachStagesToAttempts(pendingStages()); });
Template.registerHelper("numPendingStages", function() {
  return pendingStages().count();
});

skippedStages = function() {
  return StageAttempts.find({
    skipped: true
  }, { sort: { stageId: -1 }});
};
Template.registerHelper("skippedStages", function() { return attachStagesToAttempts(skippedStages()); });
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
  },
  appId: function() {
    return Applications.findOne({}, { fields: { id: 1 } }).id;
  }
});

