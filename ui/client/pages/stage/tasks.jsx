
statusStr = function(status) {
  return statuses[status];
};

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
  new Column('gcTime', 'GC Time', 'metrics.JVMGCTime', { render: formatTime, defaultSort: -1 })
]
      .concat(ioColumns)
      .concat([
        new Column('errors', 'Errors', 'errors')
      ]);

TasksTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    var app = Applications.findOne();
    var stage = StageAttempts.find({}, { limit: 1 }).fetch()[0];
    return {
      app: app,
      stage: stage
    };
  },
  render() {
    var total = this.data.stage && this.data.stage.taskCounts && this.data.stage.taskCounts.num || 0;
    var title = 'Tasks';

    var appId = this.data.app.id;
    var stageId = this.data.stage.stageId;
    var stageAttemptId = this.data.stage.id;

    return <div>
      <Table
            name='tasks'
            title={title}
            defaultSort={{ id: 'id' }}
            subscriptionFn={(opts) => { return Meteor.subscribe('stage-tasks', appId, stageId, stageAttemptId, opts); }}
            collection={TaskAttempts}
            columns={columns}
            total={total}
            />
    </div>;
  }
});
