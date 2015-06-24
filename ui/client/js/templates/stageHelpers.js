
var columns = [
  { label: 'Stage ID', id: 'id', cmpFn: sortBy('stageId') },
  { label: 'Description', id: 'desc', cmpFn: sortBy('name') },
  startColumn,
  durationColumn,
  tasksColumn
].concat(ioBytesColumns);

var columnsById = byId(columns, 'stageRow', 'stage');

// TODO(ryan): join these on the server, expose via a dedicated publish()
attachStagesToAttempts = function(attempts) {
  var sort = Session.get('stage-table-sort') || ['start', -1];
  var cmpFn = columnsById[sort[0]].cmpFn;
  var joined = attempts.map(identity);
  if (cmpFn) {
    return sort[1] == 1 ? joined.sort(cmpFn) : joined.sort(cmpFn).reverse();
  } else {
    return sort[1] == 1 ? joined.sort() : joined.sort().reverse();
  }
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
Template.registerHelper("completedStages", function() {
  return attachStagesToAttempts(completedStages(), this.appId);
});
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
Template.registerHelper("activeStages", function() { return attachStagesToAttempts(activeStages(), this.appId); });
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
Template.registerHelper("pendingStages", function() { return attachStagesToAttempts(pendingStages(), this.appId); });
Template.registerHelper("numPendingStages", function() {
  return pendingStages().count();
});

skippedStages = function() {
  return StageAttempts.find({
    skipped: true
  }, { sort: { stageId: -1 }});
};
Template.registerHelper("skippedStages", function() { return attachStagesToAttempts(skippedStages(), this.appId); });
Template.registerHelper("numSkippedStages", function() {
  return skippedStages().count();
});

Template.stagesTables.helpers({
  columns: function () {
    return columns;
  }
});

