
// Applications page
Router.route("/", {
  waitOn: function() {
    return Meteor.subscribe("apps");
  },
  action:function() {
    this.render('appsPage', { data: { apps: Applications.find() } });
  }
});

