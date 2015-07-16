
// Executors Page
Router.route("/a/:_appId/executors", {
  waitOn: function() {
    return [
      Meteor.subscribe('app', this.params._appId),
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
  new Column('id', 'ID', 'id', { truthyZero: 0 }),
  hostColumn,
  portColumn,
  startColumn,
  endColumn,
  durationColumn,
  numBlocksColumn,
  maxMemColumn
]
      .concat(spaceColumns)
      .concat(taskColumns)
      .concat([ taskTimeColumn ])
      .concat(ioColumns);

Template.executorsPage.helpers({
  columns: function() { return columns; },
  subscriptionFn: (appId) => {
    return (opts) => {
      return Meteor.subscribe("executors", appId, opts);
    };
  }
});
