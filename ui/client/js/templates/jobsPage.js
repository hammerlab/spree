
Template.jobsPage.helpers({

  schedulingMode: function(env) {
    if (env && env.spark) {
      for (var i in env.spark) {
        if (env.spark[i][0] == 'spark.scheduler.mode') {
          return env.spark[i][1];
        }
      }
    }
    return "Unknown";
  },

  completedJobs: function() {
    return Jobs.find({ succeeded: true }, { sort: { id: -1 } });
  },

  numCompletedJobs: function() {
    return Jobs.find({ succeeded: true }).count();
  },

  activeJobs: function() {
    return Jobs.find({ started: true, ended: { $exists: false } }, { sort: { id: -1 } });
  },

  numActiveJobs: function() {
    return Jobs.find({ started: true, ended: { $exists: false } }).count();
  },

  failedJobs: function() {
    return Jobs.find({ succeeded: false }, { sort: { id: -1 } });
  },

  numFailedJobs: function() {
    return Jobs.find({ succeeded: false }).count();
  }

});

Template.jobsTable.helpers({
  getJobName: function(job) {
    // NOTE(ryan): this sort presumably does not use my {appId:1,jobId:1} index on Stages.
    var stage = Stages.findOne({ jobId: job.id }, { sort: { id: -1 } });
    return stage && stage.name || "";
  },

  getJobDuration: function(job) {
    return job.time.end ?
          formatTime(job.time.end - job.time.start) :
          (formatTime(Math.max(0, moment().unix()*1000 - job.time.start)) + '...')
          ;
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
  }
})
