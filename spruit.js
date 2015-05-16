
Applications = new Mongo.Collection("apps");
Jobs = new Mongo.Collection("jobs");
Stages = new Mongo.Collection("stages");
Tasks = new Mongo.Collection("tasks");
Executors = new Mongo.Collection("executors");

function jobsAndStages(appId, queryObj) {
  queryObj = queryObj || {};
  queryObj.appId = appId;
  var jobs = Jobs.find(queryObj, {sort: {id:-1}});

  var stageIDs = [];
  jobs.map(function(job) { stageIDs = stageIDs.concat(job.stageIDs); })

  var stages = Stages.find(
        {
          appId: appId,
          id: { $in: stageIDs }
        }, {
          sort: { id: -1 }
        }
  );

  var stagesByJobId = {}
  stages.map(function(stage) {
    if (!(stage.jobId in stagesByJobId)) {
      stagesByJobId[stage.jobId] = [];
    }
    stagesByJobId[stage.jobId].push(stage);
  });

  return {
    appId: appId,
    jobs: jobs,
    stages: stages,
    stagesByJobId: stagesByJobId
  };
}

Router.route("/", function() {
  this.render('appsPage');
});

Router.route("/a/:_appId", function() {
  this.render('jobsPage', {
    data: jobsAndStages(this.params._appId)
  });
});

Router.route("/a/:_appId/job/:_id", function() {
  var appId = this.params._appId;
  var id = parseInt(this.params._id)
  console.log("params: %O", id);
  var job = Jobs.findOne( { appId: appId, id: id });

  if (!job) {
    this.render('jobPage', { data: { appId: appId, job: {id:id}, stages: [] }});
    return;
  }

  var stages = Stages.find(
        {
          appId: appId,
          id: { $in: job.stageIDs }
        },
        {
          sort: { id: -1 }
        }
  );

  this.render('jobPage', {
    data: {
      appId: appId,
      job: job,
      stages: stages
    }
  });
});

