
// Executors Page
Router.route("/a/:_appId/executors", {
  waitOn: function() {
    return [
      Meteor.subscribe('app', this.params._appId),
      Meteor.subscribe('executor-counts', { appId: this.params._appId })
    ];
  },
  action: function() {
    this.render("executorsPage", {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        counts: ExecutorCounts.findOne(),
        executorsTab: 1
      }
    });
  }
});

var columns = [
  new Column('id', 'ID', 'id', { truthyZero: 0 }),
  hostColumn,
  portColumn,
  lastUpdatedColumn,
  startColumn,
  endColumn,
  durationColumn,
  numBlocksColumn,
  maxMemColumn,
  reasonColumn
]
      .concat(spaceColumns)
      .concat(taskColumns)
      .concat([ taskTimeColumn ])
      .concat(ioColumns);

Template.executorsPage.events({
  'click #active-link, click #removed-link': unsetShowAll("executorsPage"),
  'click #all-link': setShowAll("executorsPage")
});

Template.executorsPage.helpers({
  showAll(total) {
    return !total || Cookie.get("executorsPage-showAll") !== false;
  },
  getTableData(data, label, name) {
    return getTableData(data.app, "executors", label + " Executors", data.counts[name], label + "Executors", name, columns, name === "all");
  }
});
