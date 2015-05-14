
Jobs = new Mongo.Collection("jobs")
Stages = new Mongo.Collection("stages")
Tasks = new Mongo.Collection("tasks")

function jobsAndStages(queryObj) {
  var jobs = Jobs.find(queryObj || {});

  var stageIDs = [];
  jobs.map(function(job) { stageIDs = stageIDs.concat(job.stageIDs); })

  var stages = Stages.find({ id: { $in: stageIDs } });

  var stagesByJobId = {}
  stages.map(function(stage) {
    if (!(stage.jobId in stagesByJobId)) {
      stagesByJobId[stage.jobId] = [];
    }
    stagesByJobId[stage.jobId].push(stage);
  });

  return { jobs: jobs, stages: stages, stagesByJobId: stagesByJobId };
}

Router.route("/", function() {
  this.render('jobsPage');
});

Router.route("/jobs", function() {
  this.render('jobsPage');
});

Router.route("/job/:_id", function() {
  console.log("params: %O", this.params._id);
  var job = Jobs.findOne( { id: parseInt(this.params._id) });
  var stages = Stages.find({ id: { $in: job.stageIDs }})
  this.render('jobPage', {
    data: {
      job: job,
      stages: stages
    }
  });
});

if (Meteor.isClient) {

  function formatTime(ms) {
    return ms + "ms";
  }

  Template.registerHelper("log", function(something) {
    console.log(something);
  });

  Template.registerHelper("formatDateTime", function(dt) {
    return moment(dt).format("YYYY/MM/DD HH:mm:ss");
  });

  Template.registerHelper("jobStatus", function(job) {
    if (job.succeeded) return "SUCCEEDED";
    if (job.failed) return "FAILED";
    if (job.inProgress) return "RUNNING";
    return "UNKNOWN";
  });

  Template.registerHelper("formatDuration", function(start, end) {
    return end ? formatTime(end - start) : (formatTime(moment().unix()*1000 - start) + '...');
  });

  Template.jobRows.helpers({
    data: function() {
      return jobsAndStages();
    },

    rowClass: function(job) {
      if (job.succeeded) {
        return "succeeded";
      } else if (job.inProgress) {
        return "in-progress";
      } else if (job.failed) {
        return "failed";
      } else {
        return "";
      }
    },

    getJobName: function(job, stagesByJobId) {
      return Stages.findOne({ jobId: job.id }, { sort: { id: 1}}).name;
    },

    getJobDuration: function(job) {
      return job.time.end ?
            formatTime(job.time.end - job.time.start) :
            (formatTime(Math.max(0, moment().unix()*1000 - job.time.start)) + '...')
      ;
    }

  });

  Template.jobPage.helpers({
    completed: function(stageCounts) {
      return stageCounts.num - stageCounts.running;
    }
  });
}
