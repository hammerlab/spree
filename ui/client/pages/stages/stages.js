
// Stages page
Router.route("/a/:_appId/stages", {
  waitOn: function() {
    return [
      Meteor.subscribe('stages-page', this.params._appId),
      Meteor.subscribe("num-stage-attempts", this.params._appId)
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

