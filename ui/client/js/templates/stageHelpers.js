
acc = function(key) {
  if (typeof key == 'string') {
    return acc(key.split('.'));
  }
  return key.reduce(function(soFar, next) {
    return function(x) {
      var sf = soFar(x);
      return sf ? sf[next] : undefined;
    };
  }, function(x) { return x; });
};

sortBy = function(key) {
  var fn = acc(key);
  return function(a,b) {
    var fna = fn(a);
    var fnb = fn(b);
    if (fna < fnb) return -1;
    if (fna > fnb) return 1;
    return 0;
  }
};

var columns = [
  { label: 'Stage ID', id: 'id', cmpFn: sortBy('stage.id') },
  { label: 'Description', id: 'desc', cmpFn: sortBy('stage.name') },
  { label: 'Submitted', id: 'start', cmpFn: sortBy('attempt.time.start') },
  { label: 'Duration', id: 'duration', cmpFn: function(a,b) {
    return a.attempt.time.end - a.attempt.time.start - (b.attempt.time.end - b.attempt.time.start);
  }  },
  { label: 'Tasks: Succeeded/Total', id: 'tasks', cmpFn: sortBy('attempt.taskCounts.succeeded') },
  { label: 'Input', id: 'input', cmpFn: sortBy('attempt.metrics.InputMetrics.BytesRead') },
  { label: 'Output', id: 'output', cmpFn: sortBy('attempt.metrics.OutputMetrics.BytesWritten') },
  { label: 'Shuffle Read', id: 'shuffle-read', cmpFn: function(a,b) {
    console.log("%O %O", a, b);
    return shuffleBytesRead(a.attempt.metrics.ShuffleReadMetrics) - shuffleBytesRead(b.attempt.metrics.ShuffleReadMetrics);
  } },
  { label: 'Shuffle Write', id: 'shuffle-write', cmpFn: sortBy('attempt.metrics.ShuffleWriteMetrics.ShuffleBytesWritten') }
];

var columnsById = {};
columns.forEach(function(column) {
  columnsById[column.id] = column;
});

// TODO(ryan): join these on the server, expose via a dedicated publish()
attachStagesToAttempts = function(attempts) {
  var sort = Session.get('sort') || ['start', -1];
  var cmpFn = columnsById[sort[0]].cmpFn;
  var joined = attempts.map(function(stageAttempt) {
    return { attempt: stageAttempt, stage: Stages.findOne({ id: stageAttempt.stageId }) };
  });
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
    return "stageRow-" + this.id;
  }
});

Template.stagesTable.events({
  'click th': function(e, t) {
    var prevSort = Session.get('sort');
    if (prevSort && prevSort[0] == this.id) {
      Session.set('sort', [prevSort[0], -prevSort[1]]);
    } else {
      Session.set('sort', [this.id, -1]);
    }
    console.log("event: %O, template: %O, this: %O. setting 'sort' to [%s,%d]", e, t, this, Session.get('sort')[0], Session.get('sort')[1]);
  }
});
