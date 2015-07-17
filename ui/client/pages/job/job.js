
// Job page
Router.route("/a/:_appId/job/:_jobId", {
  waitOn: function() {
    var appId = this.params._appId;
    var jobId = parseInt(this.params._jobId);
    return [
      Meteor.subscribe('job-page', appId, jobId),
      Meteor.subscribe("stage-counts", { appId: appId, jobId: jobId })
    ];
  },
  action: function() {
    this.render('jobPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        job: Jobs.findOne(),
        counts: StageCounts.findOne(),
        jobsTab: 1
      }
    });
  }
});


Template.jobPage.helpers({
  setTitle: function(data) {
    if (data && data.job && data.job.id !== undefined) {
      document.title = "Job " + data.job.id + " - Spark";
    }
  }
});

Template.registerHelper("jobStatus", function(job) {
  if (!job) { return ""; }
  if (job.succeeded) return "SUCCEEDED";
  if (job.failed) return "FAILED";
  if (job.inProgress) return "RUNNING";
  return "UNKNOWN";
});

