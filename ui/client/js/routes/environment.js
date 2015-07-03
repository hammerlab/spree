
// Environment Page
Router.route("/a/:_appId/environment", {
  waitOn: function() {
    return Meteor.subscribe('environment-page', this.params._appId);
  },
  action: function() {
    this.render("environmentPage", {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        env: Environment.findOne(),
        environmentTab: 1
      }
    });
  }
});

