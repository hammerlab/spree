
// Executors Page
Router.route("/a/:_appId/executors", {
  waitOn: function() {
    return Meteor.subscribe('executors-page', this.params._appId);
  },
  action: function() {
    this.render("executorsPage", {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        executors: Executors.find(),
        executorsTab: 1
      }
    });
  }
});
