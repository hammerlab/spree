
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
    var stage = StageAttempts.find({}, { limit: 1 }).fetch()[0];
    return {
      stage: stage,
      tasks: TaskAttempts.find().fetch(),
      opts: Cookie.get('tasks-table-opts')
    };
  },
  render() {
    var opts = this.data.opts || {};
    var start = (opts.skip || 0);
    var total = this.data.stage && this.data.stage.taskCounts && this.data.stage.taskCounts.num || 0;
    var end = Math.min(start + (opts.limit || 100), total);
    var title = 'Tasks';
    return <div>
      <Table
            name='tasks'
            title={title}
            defaultSort={{ id: 'id' }}
            collection={TaskAttempts}
            columns={columns}
            total={total} />
    </div>;
  }
});
