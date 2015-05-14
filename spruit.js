
Jobs = new Mongo.Collection("jobs")
Stages = new Mongo.Collection("stages")
Tasks = new Mongo.Collection("tasks")

function jobsWithStages(queryObj) {
  var jobs = Jobs.find(queryObj || {});
  console.log("pre jobs: %O", jobs);
  var stagesById = {}
  var stageIDs = []
  jobs.forEach(function(job) {
    console.log("job: %O", job);
    stageIDs = stageIDs.concat(job.stageIDs);
  });
  console.log("fetching stages: %s", stageIDs.join(','));
  Stages.find({id: { '$in': stageIDs }}).map(function(stage) {
    if (!(stage.id in stagesById)) {
      stagesById[stage.id] = []
    }
    stagesById[stage.id].push(stage);
  });
  console.log("stagesById: %O", stagesById);
  var j = jobs.map(function(job) {
    return {
      id: job.id,
      startTime: job.startTime,
      endTime: job.endTime,
      succeeded: job.succeeded,
      inProgress: !job.endTime,
      failed: job.endTime && !job.succeeded,
      stages: job.stageIDs.map(function (stageId) {
        var attempts = stagesById[stageId];
        return attempts ? attempts[attempts.length - 1] : [];
      })
    }
  });
  return j;
}

Router.route("/", function() {
  this.render('jobsPage');
});

Router.route("/jobs", function() {
  this.render('jobsPage');
});

Router.route("/job/:_id", function() {
  console.log("params: %O", this.params._id);
  var jobs = jobsWithStages({ id: parseInt(this.params._id) });
  console.log("jobs: %O", jobs);
  this.render('jobPage', { data: jobs.length ? jobs[0] : null });
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
    jobs: function() {
      return jobsWithStages();
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

    getJobDuration: function(job) {
      return job.endTime ? formatTime(job.endTime - job.startTime) : (formatTime(moment().unix()*1000 - job.startTime) + '...');
    },

    getSucceededStages: function(job) {
      return job.stages.filter(function(stage) { return stage.endTime && !stage.failureReason; }).length;
    },

    getSucceededTasks: function(job) {
      var s = 0;
      job.stages.forEach(function(stage) { s += (stage.tasksSucceeded || 0); });
      return s;
    },

    getStartedTasks: function(job) {
      var s = 0;
      job.stages.forEach(function(stage) { s += (stage.tasksStarted || 0); });
      return s;
    },

    getNumTasks: function(job) {
      var s = 0;
      job.stages.forEach(function(stage) { s += (stage.numTasks || 0); });
      return s;
    },

    getFailedTasks: function(job) {
      var s = 0;
      job.stages.forEach(function(stage) { s += (stage.failedTasks || 0); });
      return s;
    }
  });

  Template.jobPage.helpers({
    numCompleteStages: function(job) {
      return job.stages.filter(function(stage) {
        return !!stage.completionTime;
      }).length;
    },
    numSucceededStages: function(job) {
      return job.stages.filter(function(stage) {
        return !!stage.completionTime && !stage.failed;
      }).length;
    },
    numFailedStages: function(job) {
      return job.stages.filter(function(stage) {
        return stage.failed;
      }).length;
    },
    numRunningStages: function(job) {
      return job.stages.filter(function(stage) {
        return !stage.completionTime;
      }).length;
    }
  });
}
