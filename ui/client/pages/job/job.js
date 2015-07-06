
// Job page
Router.route("/a/:_appId/job/:_jobId", {
  waitOn: function() {
    return Meteor.subscribe('job-page', this.params._appId, parseInt(this.params._jobId));
  },
  action: function() {
    this.render('jobPage', {
      data: jQuery.extend(getStagesData(), {
        appId: this.params._appId,
        app: Applications.findOne(),
        job: Jobs.findOne(),
        jobsTab: 1
      })
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

