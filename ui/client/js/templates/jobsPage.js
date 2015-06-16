
Template.jobsPage.helpers({

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
  }

});

