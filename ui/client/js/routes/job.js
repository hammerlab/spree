
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

