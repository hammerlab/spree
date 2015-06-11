
// Applications page
Router.route("/", function() {
  if (Meteor.isClient) {
    Meteor.subscribe("apps");
  }
  this.render('appsPage');
});

// Application/Jobs page
Router.route("/a/:_appId", function() {
  var appId = this.params._appId;
  Meteor.subscribe("jobs", appId);
  var jobs = Jobs.find({}, { sort: { id: -1 } });
  var jobIDs = jobs.map(function(job) { return job.id; });
  Meteor.subscribe("jobs-stages", appId, jobIDs);
  this.render('jobsPage', {
    data: {
      appId: appId,
      jobs: jobs,
      stages: Stages.find(),
      jobsTab: 1
    }
  });
});

// Job page
Router.route("/a/:_appId/job/:_jobId", function() {
  var appId = this.params._appId;
  var jobId = parseInt(this.params._jobId);

  Meteor.subscribe("job", appId, jobId);
  Meteor.subscribe("job-stages", appId, jobId);
  Meteor.subscribe("job-stage-attempts", appId, jobId);

  this.render('jobPage', {
    data: {
      appId: appId,
      job: Jobs.findOne(),
      stages: Stages.find({}, { sort: { id: -1 } }),
      attempts: StageAttempts.find({}, { sort: { stageId: -1, id: -1 }}),
      jobsTab: 1
    }
  });
});

// Stages page
Router.route("/a/:_appId/stages", function() {
  var appId = this.params._appId;
  Meteor.subscribe("app", appId);
  Meteor.subscribe("stages", appId);
  Meteor.subscribe("stage-attempts", appId);
  this.render('stagesPage', {
    data: {
      //app: Applications.findOne(),
      appId: appId,
      stages: Stages.find(),
      attempts: StageAttempts.find(),
      stagesTab: 1
    }
  });
});

function sortNumber(a,b) {
  return a - b;
}

function makeSummaryStats(name, arr) {
  var n = arr.length;
  return {
    name: name,
    stats: [
      arr[0],
      arr[Math.floor(n/4)],
      arr[Math.floor(n/2)],
      arr[Math.floor(3*n/4)],
      arr[n-1]
    ]
  }
}

// StageAttempt page
Router.route("/a/:_appId/stage/:_stageId", function() {
  var appId = this.params._appId;
  var stageId = parseInt(this.params._stageId);
  var attemptId = this.params.query.attempt ? parseInt(this.params.query.attempt) : 0;
  console.log("looking up stage %d.%d", stageId, attemptId);
  Meteor.subscribe("stage-attempt", appId, stageId, attemptId);
  Meteor.subscribe("stage-attempt-stage", appId, stageId);
  Meteor.subscribe("tasks", appId, stageId);
  Meteor.subscribe("task-attempts", appId, stageId, attemptId);
  Meteor.subscribe("executors", appId);

  var durations =
        Tasks.find(
              {"time.start": {$exists:1}, "time.end": {$exists:1}},
              { select: { "time.start": 1, "time.end": 1 }}
        ).map(function(t) {
                return t.time.end - t.time.start;
              }).sort(sortNumber);

  console.log("durations: %d", durations.length);

  this.render('stagePage', {
    data: {
      appId: appId,
      stage: Stages.findOne(),
      stageAttempt: StageAttempts.findOne(),
      tasks: Tasks.find(),
      taskAttempts: TaskAttempts.find(),
      executors: Executors.find(),
      durations: makeSummaryStats("Duration", durations),
      stagesTab: 1
    }
  });
});

// Storage page
Router.route("/a/:_appId/storage", function() {
  var appId = this.params._appId;
  Meteor.subscribe("rdds", appId);
  this.render('storagePage', {
    data: {
      appId: appId,
      rdds: RDDs.find(),
      storageTab: 1
    }
  })
});

