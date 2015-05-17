
Applications = new Mongo.Collection("apps");
Jobs = new Mongo.Collection("jobs");
Stages = new Mongo.Collection("stages");
Tasks = new Mongo.Collection("tasks");
Executors = new Mongo.Collection("executors");

function parseMongoUrl(url) {
  var m = url.match("^mongodb://([^:]+):([0-9]+)/(.*)$")
  if (!m) return {};
  return {
    host: m[1],
    port: parseInt(m[2]),
    db: m[3],
    url: url,
    shortUrl: url.substr("mongodb://".length)
  };
}

if (Meteor.isServer) {

  console.log("Starting server with Mongo URL: " + process.env.MONGO_URL);

  Meteor.publish('mongoUrl', function () {
    this.added('mongoUrl', '1', parseMongoUrl(process.env.MONGO_URL));
    this.ready();
  });

  // Apps page
  Meteor.publish("apps", function() {
    return Applications.find();
  });

  // Jobs page
  Meteor.publish("jobs", function(appId) {
    return Jobs.find({appId: appId}, { sort: { id: -1 } });
  });
  Meteor.publish("last-stages", function(appId, jobIds) {
    var jobs = Jobs.find({ appId: appId, id: { $in: jobIds }});
    var lastStageIDs = jobs.map(function(job) {
      return Math.max.apply(null, job.stageIDs);;
    });
    return Stages.find({ appId: appId, id: { $in: lastStageIDs }});
  });

  // Job page
  Meteor.publish("job", function(appId, jobId) {
    return Jobs.find({appId: appId, id: jobId});
  });
  Meteor.publish("job-stages", function(appId, jobId) {
    return Stages.find({ appId: appId, jobId: jobId }, { sort: { id: -1 }});
  });

  // Stages page
  Meteor.publish("stages", function(appId) {
    return Stages.find({ appId: appId });
  });

  // Stage page
  Meteor.publish("stage", function(appId, stageId, attemptId) {
    return Stages.find({ appId: appId, id: stageId, attempt: attemptId });
  });
  Meteor.publish("tasks", function(appId, stageId, attemptId) {
    return Tasks.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId });
  });
}

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
  Meteor.subscribe("last-stages", appId, jobIDs);
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
  var jobId = parseInt(this.params._jobId)

  Meteor.subscribe("job", appId, jobId);
  Meteor.subscribe("job-stages", appId, jobId);

  this.render('jobPage', {
    data: {
      appId: appId,
      job: Jobs.findOne(),
      stages: Stages.find({}, { sort: { id: -1 } }),
      jobsTab: 1
    }
  });
});

// Stages page
Router.route("/a/:_appId/stages", function() {
  var appId = this.params._appId;
  Meteor.subscribe("stages", appId);
  this.render('stagesPage', {
    data: {
      appId: appId,
      stages: Stages.find(),
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

Router.route("/a/:_appId/stage/:_stageId", function() {
  var appId = this.params._appId;
  var stageId = parseInt(this.params._stageId);
  var attemptId = this.params.query.attempt ? parseInt(this.params.query.attempt) : 0;
  console.log("looking up stage %d.%d", stageId, attemptId);
  Meteor.subscribe("stage", appId, stageId, attemptId);
  Meteor.subscribe("tasks", appId, stageId, attemptId);

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
      tasks: Tasks.find(),
      durations: makeSummaryStats("Duration", durations),
      stagesTab: 1
    }
  });
});
