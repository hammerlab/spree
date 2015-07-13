
// StageAttempt page
Router.route("/a/:_appId/stage/:_stageId", {
  waitOn: function() {
    var appId = this.params._appId;
    var stageId = parseInt(this.params._stageId);
    var attemptId = this.params.query.attempt ? parseInt(this.params.query.attempt) : 0;
    return [
      Meteor.subscribe('stage-page', appId, stageId, attemptId, Cookie.get("tasks-table-opts"), Cookie.get("stageExecutors-table-opts")),
      Meteor.subscribe("stage-summary-metrics", appId, stageId, attemptId),
      Meteor.subscribe("num-stage-executors", appId, stageId, attemptId)
    ];
  },
  action: function() {
    var appId = this.params._appId;
    var stageId = parseInt(this.params._stageId);
    var attemptId = this.params.query.attempt ? parseInt(this.params.query.attempt) : 0;
    var stageAttempt = StageAttempts.findOne();

    if (!stageAttempt) {
      this.render('stagePage', {
        data: {
          appId: appId,
          app: Applications.findOne(),
          stageId: stageId,
          attemptId: attemptId,
          stagesTab: 1
        }
      });
      return;
    }

    this.render('stagePage', {
      data: {
        appId: appId,
        app: Applications.findOne(),
        stageAttempt: stageAttempt,
        stageId: stageId,
        attemptId: attemptId,
        stagesTab: 1
      }
    });
  }
});

Template.stagePage.helpers({
  setTitle: function(data) {
    document.title = "Stage " + data.stageId + " (" + data.attemptId + ")";
    return null;
  },
  SummaryMetricsTable: () => { return SummaryMetricsTable; },
  TasksTable: () => { return TasksTable; },
  StageExecutorsTable: () => { return StageExecutorsTable; }
});




