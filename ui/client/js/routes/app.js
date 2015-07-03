
// Application/Jobs page
Router.route("/a/:_appId", {
  waitOn: function() {
    return Meteor.subscribe("jobs-page", this.params._appId);
  },
  action: function() {
    var jobs = Jobs.find().map(function(job) {
      var lastStage = Stages.findOne({ jobId: job.id }, { sort: { id: -1 } });
      job.name = lastStage && lastStage.name || "";
      return job;
    });
    var completedJobs = jobs.filter(function(job) { return job.succeeded; });
    var activeJobs = jobs.filter(function(job) { return (job.started || job.time.start) && !job.ended; });
    var failedJobs = jobs.filter(function(job) { return job.succeeded == false; });
    this.render('jobsPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        all: { jobs: jobs, num: jobs.length },
        completed: { jobs: completedJobs, num: completedJobs.length },
        active: { jobs: activeJobs, num: activeJobs.length },
        failed: { jobs: failedJobs, num: failedJobs.length },
        env: Environment.findOne(),
        jobsTab: 1
      }
    });
  }
});

