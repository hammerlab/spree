
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
  },
  name: 'executors'
});

// thread dump column for executor
var threadDumpColumn = new Column(
  'threadDump',
  'Thread Dump',
  'id',
  {
    render: (executor) => {
      var href = ["", "a", executor.appId, "executors", executor.id, "threadDump"].join('/');
      return <div><a href={href}>Thread Dump</a></div>;
    },
    renderKey: ''
  }
);

var baseExecutorColumns = [
  new Column('id', 'ID', 'id', { truthyZero: 0 }),
  hostColumn,
  portColumn,
  lastUpdatedColumn,
  startColumn,
  numBlocksColumn,
  maxMemColumn
]
      .concat([
        memPercentColumn,
        executorMemUsageProgressBarColumn,
        memColumn.copy({ showByDefault: false }),
        diskColumn,
        offHeapColumn
      ])
      .concat(taskColumns)
      .concat(taskTimeRollupColumns)
      .concat(ioColumns())
      .concat([logUrlsColumn])
      .concat([threadDumpColumn]);

var executorEndedColumns = [
  reasonColumn,
  endColumn.copy({ showByDefault: false }),
  durationColumn.copy({ showByDefault: false })
];

var allExecutorColumns = baseExecutorColumns.concat(executorEndedColumns);

Template.executorsPage.events({
  'click #active-link, click #removed-link': unsetShowAll("executorsPage"),
  'click #all-link': setShowAll("executorsPage")
});

Template.executorsPage.helpers({
  showAll(total) {
    return !total || Cookie.get("executorsPage-showAll") !== false;
  },
  getTableData(data, label, name) {
    return getTableData(
          data.app,
          "executors",
          label + " Executors",
          data.counts[name],
          label + "Executors",
          name,
          name === 'running' ? baseExecutorColumns : allExecutorColumns,
          name === "all"
    );
  }
});
