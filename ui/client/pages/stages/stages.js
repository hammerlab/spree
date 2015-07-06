
// Stages page
Router.route("/a/:_appId/stages", {
  waitOn: function() {
    return Meteor.subscribe('stages-page', this.params._appId);
  },
  action: function() {
    this.render('stagesPage', {
      data: jQuery.extend(getStagesData(), {
        appId: this.params._appId,
        app: Applications.findOne(),
        stagesTab: 1
      })
    });
  }
});

