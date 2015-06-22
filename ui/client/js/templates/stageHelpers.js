
var columns = [
  { label: 'Stage ID', id: 'id' },
  { label: 'Description', id: 'desc' },
  { label: 'Submitted', id: 'start' },
  { label: 'Duration', id: 'end' },
  { label: 'Tasks: Succeeded/Total', id: 'tasks' },
  { label: 'Input', id: 'input' },
  { label: 'Output', id: 'output' },
  { label: 'Shuffle Read', id: 'shuffle-read' },
  { label: 'Shuffle Write', id: 'shuffle-write' }
];

// TODO(ryan): join these on the server, expose via a dedicated publish()
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

Template.stagesTable.helpers({
  columns: function() { return columns; },
  getTemplateName: function() {
    return "stageRow-" + this.id;;
  }
});

Template.stagesTable.events({
  'click th': function(e, t) {
    console.log("event: %O, template: %O", e, t);
    var sortObj = {};
    sortObj[e.currentTarget.cellIndex] = -1;
    Session.set('sort', sortObj);
  }
});
