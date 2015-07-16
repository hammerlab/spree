
// Stages page
Router.route("/a/:_appId/stages", {
  waitOn: function() {
    return [
      Meteor.subscribe('app', this.params._appId),
      Meteor.subscribe("stage-counts", { appId: this.params._appId })
    ];
  },
  action: function() {
    this.render('stagesPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        stagesTab: 1
      }
    });
  }
});

