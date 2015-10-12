
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
    var stageId = parseInt(this.params._stageId);
    var attemptId = this.params.query.attempt ? parseInt(this.params.query.attempt) : 0;
    if (!stageAttempt) {
      this.render('stagePage', {
        data: {
          appId: appId,
          app: Applications.findOne(),
          stagesTab: 1,
          stageId: stageId,
          attemptId: attemptId
        }
      });
      return;
    }

    this.render('stagePage', {
      data: {
        appId: appId,
        app: Applications.findOne(),
        stageAttempt: stageAttempt,
        stagesTab: 1,
        stageId: stageId,
        attemptId: attemptId
      }
    });
  }
});

var statsData = {
  'duration': { label: 'Duration', render: formatTime },
  'metrics.ExecutorRunTime': { label: 'Run Time', render: formatTime },
  'metrics.ExecutorDeserializeTime': { label: 'Task Deserialization Time', render: formatTime },
  'metrics.GettingResultTime': { label: 'Getting Result Time', render: formatTime },
  'metrics.SchedulerDelayTime': { label: 'Scheduler Delay Time', render: formatTime },
  'metrics.ResultSerializationTime': { label: 'Result Serialization Time', render: formatTime },
  'metrics.JVMGCTime': { label: 'GC Time', render: formatTime },
  'metrics.InputMetrics.BytesRead': { label: 'Input Bytes', render: formatBytes },
  'metrics.InputMetrics.RecordsRead': { label: 'Input Records' },
  'metrics.OutputMetrics.BytesWritten': { label: 'Output Bytes', render: formatBytes },
  'metrics.OutputMetrics.RecordsWritten': { label: 'Output Records' },
  'metrics.ShuffleReadMetrics.TotalBytesRead': { label: 'Shuffle Read Bytes', render: formatBytes },
  'metrics.ShuffleReadMetrics.TotalRecordsRead': { label: 'Shuffle Read Records' },
  'metrics.ShuffleWriteMetrics.ShuffleBytesWritten': { label: 'Shuffle Write Bytes', render: formatBytes },
  'metrics.ShuffleWriteMetrics.ShuffleRecordsWritten': { label: 'Shuffle Write Records' }
};

var statsColumns = [
  new Column('id', 'Metric', 'label'),
  new Column('min', 'Min', 'min'),
  new Column('tf', '25th Percentile', 'tf'),
  new Column('median', 'Median', 'median'),
  new Column('sf', '75th Percentile', 'sf'),
  new Column('max', 'Max', 'max')
];

var executorColumns = [
  new Column('id', 'Executor ID', 'execId', { truthyZero: true }),
  new Column('host', 'Host', 'host'),
  new Column('port', 'Port', 'port', { showByDefault: false })
]
      .concat(taskTimeRollupColumns)
      .concat(taskColumns)
      .concat(ioColumns(true));

var accumulatorColumns = [
  new Column('id', 'ID', 'ID', { showByDefault: false }),
  new Column('name', 'Name', 'Name'),
  new Column('value', 'Value', 'Value')
];

var taskErrorColumn =
      new Column(
            'errors',
            'Errors',
            'end.Reason',
            {
              requireOracle: 'taskCounts.failed',
              renderKey: 'end',
              render: (end) => {
                return end ? <TaskEnd {...end} /> : null;
              }
            }
      );
// Per-task table
var taskTableColumns = [
  new Column('index', 'Index', 'index', { truthyZero: true }),
  new Column('id', 'ID', 'id'),
  new Column('attempt', 'Attempt', 'attempt'),
  lastUpdatedColumn,
  statusColumn,
  new Column('localityLevel', 'Locality Level', 'locality'),
  new Column('execId', 'Executor', 'execId'),
  new Column('host', 'Host', 'metrics.HostName'),
  portColumn,
  startColumn
]
      .concat(taskTimeColumns)
      .concat(ioColumns(true))
      .concat([ taskErrorColumn ]);

function getSubscriptionFn(name, stage) {
  return stage && (
              (opts) => {
                return Meteor.subscribe(name, stage.appId, stage.stageId, stage.id, opts);
              }
        );
}

Template.stagePage.helpers({
  setTitle: function(data) {
    document.title = "Stage " + data.stageId + " (" + data.attemptId + ")";
    return null;
  },
  getSummaryMetricsTableData: (stageAttempt) => {
    return {
      component: Table,
      name: "summaryMetrics",
      title: "Summary Metrics",
      columns: statsColumns,
      subscriptionFn: getSubscriptionFn("stage-summary-metrics", stageAttempt),
      collection: "StageSummaryMetrics",
      rowData: statsData,
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
    if (stageAttempt) {
      for (var k in stageAttempt.accumulables) {
        accumulables.push(stageAttempt.accumulables[k]);
      }
    }
    return {
      component: Table,
      name: "accumulables",
      data: accumulables,
      total: accumulables.length,
      title: "Accumulables",
      paginate: false,
      columns: accumulatorColumns,
      keyFn: "id",
      clientSort: true
    }
  },
  getTasksTableData: (stageAttempt) => {
    var accumColumns = [];
    var n = 0;
    if (stageAttempt) {
      for (var k in stageAttempt.accumulables) {
        var a = stageAttempt.accumulables[k];
        var opts = {};
        if (n >= 5) {
          opts.showByDefault = false;
        }
        accumColumns.push(new Column('accum-' + a.ID, a.Name, ['accumulables', a.ID, 'Update'].join('.'), opts));
        n++;
      }
    }
    return {
      component: Table,
      columns: taskTableColumns.concat(accumColumns),
      subscriptionFn: getSubscriptionFn("stage-tasks", stageAttempt),
      collection: "TaskAttempts",
      name: "tasks",
      title: "Tasks",
      total: stageAttempt && stageAttempt.taskCounts.num || 0,
      columnOracle: stageAttempt
    };
  }
});

