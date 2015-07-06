
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


var columns = [
  { id: '0', label: 'Name', sortBy: "0" },
  { id: '1', label: 'Value', sortBy: "1" }
];

Template.environmentPage.helpers({
  columns: function() { return columns; }
});
