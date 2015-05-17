
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
}

// Applications page
Router.route("/", function() {
  if (Meteor.isClient) {
    Meteor.subscribe("apps");
  }
  this.render('appsPage');
});

// Jobs page
Router.route("/a/:_appId", function() {
  var appId = this.params._appId;
  Meteor.subscribe("jobs", appId);
  var jobs = Jobs.find({}, { sort: { id: -1 } });
  var jobIDs = jobs.map(function(job) { return job.id; });
  Meteor.subscribe("last-stages", appId, jobIDs);
  this.render('jobsPage', {
    data: {
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
      stages: Stages.find({}, { sort: { id: -1 } })
    }
  });
});

