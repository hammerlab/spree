
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
    if (!stage || !('tasks' in stage)) {
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
        })
      };
    } else {
      // Tasks are embedded as sub-records of StageAttempt record.
      var tasks = [];
      var tasksObj = stage.tasks;
      for (var k in tasksObj) {
        tasks.push(tasksObj[k]);
      }
      return {
        stage: stage,
        tasks: tasks
      };
    }
  },
  render() {
    return <div>
      <Table
            name='tasks'
            title={'Tasks (' + (this.data.tasks && this.data.tasks.length || 0) + ')'}
            defaultSort={{ id: 'id' }}
            data={this.data.tasks}
            columns={columns} />
    </div>;
  }
});
