
// Storage page
Router.route("/a/:_appId/storage", {
  waitOn: function() {
    return Meteor.subscribe("rdds-page", this.params._appId);
  },
  action: function() {
    this.render('storagePage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        rdds: RDDs.find(),
        storageTab: 1
      }
    });
  }
});

