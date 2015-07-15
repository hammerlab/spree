
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

// Per-task table
var columns = [
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
        new Column('errors', 'Errors', 'errors')
      ]);


Template.stagePage.helpers({
  setTitle: function(data) {
    document.title = "Stage " + data.stageId + " (" + data.attemptId + ")";
    return null;
  },
  statsColumns: () => { return statsColumns; },
  executorColumns: () => { return executorColumns; },
  taskColumns: () => { return columns; },
  getSubscriptionFn: (name, stage) => {
    return (opts) => {
      return Meteor.subscribe(name, stage.appId, stage.stageId, stage.id, opts);
    };
  }
});

