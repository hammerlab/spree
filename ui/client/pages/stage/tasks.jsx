
statusStr = function(status) {
  return statuses[status];
};

// Per-task table
var columns = [
  { id: 'index', label: 'Index', sortBy: 'index' },
  { id: 'id', label: 'ID', sortBy: 'id' },
  { id: 'attempt', label: 'Attempt', sortBy: 'attempt' },
  { id: 'status', label: 'Status', sortBy: 'status', render: statusStr },
  { id: 'localityLevel', label: 'Locality Level', sortBy: 'locality' },
  { id: 'execId', label: 'Executor', sortBy: 'execId' },
  hostColumn,
  portColumn,
  startColumn,
  durationColumn,
  { id: 'gcTime', label: 'GC Time', sortBy: 'metrics.JVMGCTime', render: formatTime, defaultSort: -1 }
]
      .concat(ioColumns)
      .concat([
        { id: 'errors', label: 'Errors', sortBy: 'errors' }
      ]);

TasksTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    var stage = StageAttempts.find({}, { limit: 1 }).fetch()[0];
    // Tasks are standalone records in the TaskAttempts collection.
    var eById = {};
    Executors.find().forEach((e) => {
      eById[e.id] = { host: e.host, port: e.port };
    });
    return {
      stage: stage,
      tasks: TaskAttempts.find().fetch().map((t) => {
        var e = eById[t.execId];
        if (!e) return t;
        t.host = e.host;
        t.port = e.port;
        return t;
      }),
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
