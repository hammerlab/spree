
// StageAttempt page
Router.route("/a/:_appId/stage/:_stageId", {
  waitOn: function() {
    var appId = this.params._appId;
    var stageId = parseInt(this.params._stageId);
    var attemptId = this.params.query.attempt ? parseInt(this.params.query.attempt) : 0;
    return [
      Meteor.subscribe('stage-page', appId, stageId, attemptId),
      Meteor.subscribe("num-stage-executors", appId, stageId, attemptId)
    ];
  },
  action: function() {
    var appId = this.params._appId;
    var stageAttempt = StageAttempts.findOne();
    if (!stageAttempt) {
      this.render('stagePage', {
        data: {
          appId: appId,
          app: Applications.findOne(),
          stagesTab: 1
        }
      });
      return;
    }

    this.render('stagePage', {
      data: {
        appId: appId,
        app: Applications.findOne(),
        stageAttempt: stageAttempt,
        stagesTab: 1
      }
    });
  }
});

statusStr = function(status) {
  return statuses[status];
};


var statsColumns = [
  new Column('id', 'Metric', 'label'),
  new Column('min', 'Min', 'stats.min'),
  new Column('tf', '25th Percentile', 'stats.tf'),
  new Column('median', 'Median', 'stats.median'),
  new Column('sf', '75th Percentile', 'stats.sf'),
  new Column('max', 'Max', 'stats.max')
];

var executorColumns = [
  new Column('id', 'Executor ID', 'execId', { truthyZero: true }),
  new Column('host', 'Host', 'host'),
  new Column('port', 'Port', 'port', { showByDefault: false }),
  taskTimeColumn
]
      .concat(taskColumns)
      .concat(ioColumns);

var accumulatorColumns = [
  new Column('id', 'ID', 'ID', { showByDefault: false }),
  new Column('name', 'Name', 'Name'),
  new Column('value', 'Value', 'Value')
];

var errorColumn =
      new Column(
            'errors',
            'Errors',
            'end.reason',
            {
              requireOracle: (stageAttempt) => { return stageAttempt.taskCounts && stageAttempt.taskCounts.failed; },
              renderKey: 'end',
              render: (end) => {
                return <TaskEnd {...end} />;
              }
            }
      );
// Per-task table
var taskTableColumns = [
  new Column('index', 'Index', 'index', { truthyZero: true }),
  new Column('id', 'ID', 'id'),
  new Column('attempt', 'Attempt', 'attempt'),
  new Column('status', 'Status', 'status', { render: statusStr }),
  new Column('localityLevel', 'Locality Level', 'locality'),
  new Column('execId', 'Executor', 'execId'),
  hostColumn,
  portColumn,
  startColumn,
  durationColumn,
  gcColumn
]
      .concat(ioColumns)
      .concat([
        errorColumn,
        new Column('spillMem', 'Memory Spilled', 'metrics.MemoryBytesSpilled', { render: formatBytes, requireOracle: true }),
        new Column('spillDisk', 'Disk Spilled', 'metrics.DiskBytesSpilled', { render: formatBytes, requireOracle: true })
      ]);

function getSubscriptionFn(name, stage) {
  return (opts) => {
    return Meteor.subscribe(name, stage.appId, stage.stageId, stage.id, opts);
  };
}

Template.stagePage.helpers({
  setTitle: function(data) {
    document.title = "Stage " + data.stageId + " (" + data.id + ")";
    return null;
  },
  getSummaryMetricsTableData: (stageAttempt) => {
    return {
      component: Table,
      name: "summaryMetrics",
      title: "Summary Metrics",
      columns: statsColumns,
      subscriptionFn: getSubscriptionFn("stage-summary-metrics", stageAttempt),
      collection: "SummaryMetrics",
      allowEmptyColumns: true,
      hideEmptyRows: true,
      hideRowCount: true,
      paginate: false,
      disableSort: true,
      selectRows: true,
      class: "stats"
    };
  },
  getExecutorTableData: (stageAttempt) => {
    return {
      component: Table,
      columns: executorColumns,
      subscriptionFn: getSubscriptionFn("stage-executors", stageAttempt),
      collection: "StageExecutors",
      name: "stageExecutors",
      title: "Executors",
      totalCollection: "NumStageExecutors",
      columnOracle: stageAttempt,
      keyFn: "execId"
    };
  },
  getAccumulatorsTableData: (stageAttempt) => {
    var accumulables = [];
    for (var k in stageAttempt.accumulables) {
      accumulables.push(stageAttempt.accumulables[k]);
    }
    return {
      component: Table,
      data: accumulables,
      total: accumulables.length,
      title: "Accumulables",
      paginate: false,
      columns: accumulatorColumns,
      keyFn: "ID",
      class: "env",
      clientSort: true
    }
  },
  getTasksTableData: (stageAttempt) => {
    var accumColumns = [];
    var n = 0;
    for (var k in stageAttempt.accumulables) {
      var a = stageAttempt.accumulables[k];
      var opts = {};
      if (n >= 5) {
        opts.showByDefault = false;
      }
      accumColumns.push(new Column('accum-' + a.ID, a.Name, ['accumulables', a.ID, 'Update'].join('.'), opts));
      n++;
    }
    return {
      component: Table,
      columns: taskTableColumns.concat(accumColumns),
      subscriptionFn: getSubscriptionFn("stage-tasks", stageAttempt),
      collection: "TaskAttempts",
      name: "tasks",
      title: "Tasks",
      total: stageAttempt.taskCounts.num,
      columnOracle: stageAttempt
    };
  }
});

