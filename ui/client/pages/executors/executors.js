
// Executors Page
Router.route("/a/:_appId/executors", {
  waitOn: function() {
    return [
      Meteor.subscribe('executors-page', this.params._appId, Cookie.get("executors-table-opts")),
      Meteor.subscribe('num-executors', this.params._appId)
    ];
  },
  action: function() {
    this.render("executorsPage", {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        executorsTab: 1
      }
    });
  }
});

var columns = [
  { id: 'id', label: 'ID', sortBy: 'id' },
  hostColumn,
  portColumn,
  numBlocksColumn,
  maxMemColumn
]
      .concat(spaceColumns)
      .concat(taskColumns)
      .concat([ taskTimeColumn ])
      .concat(ioBytesColumns);

Template.executorsPage.helpers({
  columns: function() { return columns; }
});
