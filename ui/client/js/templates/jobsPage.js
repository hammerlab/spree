
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

  getTaskCounts: function(job) {
    var stages = Stages.find({jobId: job.id}, { fields: { taskCounts: 1 } });
    var running = 0;
    var succeeded = 0;
    stages.forEach(function(stage) {
      running += stage.taskCounts ? stage.taskCounts.running : 0;
      succeeded += stage.taskCounts ? stage.taskCounts.succeeded : 0;
    });
    return {
      num: job.taskCounts.num,
      running: running,
      succeeded: succeeded
    };
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

