

Template.stagePage.helpers({
  setTitle: function(data) {
    document.title = "Stage " + data.stageId + " (" + data.attemptId + ")";
    return null;
  },
  SummaryMetricsTable: () => { return SummaryMetricsTable; },
  TasksTable: () => { return TasksTable; },
  ExecutorsTable: () => { return ExecutorsTable; }
});

Template.exceptionFailure.helpers({
  exceptionFailure: function(reason) {
    return reason == "ExceptionFailure"
  }
});
Template.fetchFailure.helpers({
  fetchFailure: function(reason) {
    return reason == "FetchFailure"
  }
});

getHostPort = function(e) {
  if (typeof e == 'string') {
    e = Executors.findOne({id: e});
  }
  if (e) {
    return e.host + ':' + e.port;
  }
  return null;
};

Template.executorLostFailure.helpers({
  executorLostFailure: function(reason) {
    return reason == "ExecutorLostFailure"
  },
  getHostPort: getHostPort
});

Template.summaryStatsTable.helpers({
  numCompletedTasks: function(taskCounts) {
    return taskCounts && ((taskCounts.succeeded || 0) + (taskCounts.failed || 0));
  }
});

var statsColumns = [
  { id: 'id', label: 'Metric', sortBy: 'id', template: 'id' },
  { id: 'min', label: 'Min', sortBy: 'min' },
  { id: 'tf', label: '25th Percentile', sortBy: 'tf' },
  { id: 'median', label: 'Median', sortBy: 'median' },
  { id: 'sf', label: '75th Percentile', sortBy: 'sf' },
  { id: 'max', label: 'Max', sortBy: 'max' }
];

SummaryMetricsTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    return {
      stats: this.props.stats.map((stat) => {
        if (stat.template == 'bytes') {
          stat.render = formatBytes;
        } else if (stat.template == 'time') {
          stat.render = formatTime;
        }
        return stat;
      })
    };
  },
  render() {
    var tc = this.props.taskCounts || {};
    return <div>
      <h4>
        Summary Metrics for {(tc.succeeded || 0) + (tc.failed || 0)} Completed Tasks
        ({tc.num || 0} total,{' '}
        {tc.running || 0} active,{' '}
        {tc.failed || 0} failed,{' '}
        {tc.succeeded || 0} succeeded)
      </h4>
      <Table
            defaultSort={{ id: 'id' }}
            data={this.props.stats}
            columns={statsColumns}
            class="stats"
            allowEmptyColumns={true}
            disableSort={true}
            />
    </div>;
  }
});

// Per-executor table
var executorColumns = [
  { id: 'id', label: 'Executor ID', sortBy: 'id', template: 'id' },
  { id: 'address', label: 'Address', sortBy: getHostPort },
  taskTimeColumn
]
      .concat(taskColumns)
      .concat(ioColumns);

ExecutorsTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    // Pull the data relevant to this stage from the executor's "stages" field out to the top level.
    return {
      executors: Executors.find().fetch().map((e) => {
        if (this.props.stageId in e.stages) {
          var stage = e.stages[this.props.stageId];
          if (this.props.attemptId in stage) {
            var attempt = stage[this.props.attemptId];
            if ('metrics' in attempt) {
              e.metrics = attempt.metrics;
            }
            if ('taskCounts' in attempt) {
              e.taskCounts = attempt.taskCounts;
            }
            delete e['stages'];
          }
        }
        return e;
      })
    };
  },
  render() {
    return <div>
      <h4>Executors ({this.data.executors && this.data.executors.length || 0})</h4>
      <Table
            name='executors'
            defaultSort={{ id: 'id' }}
            data={this.data.executors}
            columns={executorColumns} />
    </div>;
  }
});


statusStr = function(status) {
  return statuses[status];
};

// Per-task table
var columns = [
  { id: 'index', label: 'Index', sortBy: 'index' },
  { id: 'id', label: 'ID', sortBy: 'id', template: 'id' },
  { id: 'attempt', label: 'Attempt', sortBy: 'attempt' },
  { id: 'status', label: 'Status', sortBy: 'status', render: statusStr },
  { id: 'localityLevel', label: 'Locality Level', sortBy: 'locality' },
  { id: 'execId', label: 'Executor', sortBy: 'execId' },
  { id: 'host', label: 'Host', sortBy: 'host', template: 'host' },
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
    //var tasks = [];
    //var stage = StageAttempts.find({}, { limit: 1 }).fetch()[0];
    //if (!stage) return {};
    //var tasksObj = stage.tasks;
    //for (var k in tasksObj) {
    //  tasks.push(tasksObj[k]);
    //}
    //return {
    //  //stage: StageAttempts.find({}, { limit: 1 }),
    //  tasks: tasks
    //};
    var eById = {};
    Executors.find().forEach((e) => {
      eById[e.id] = { host: e.host, port: e.port };
    });
    return {
      tasks: TaskAttempts.find().fetch().map((t) => {
        t.host = eById[t.execId].host;
        t.port = eById[t.execId].port;
        return t;
      })
    };
  },
  render() {
    return <div>
      <h4>Tasks ({this.data.tasks && this.data.tasks.length || 0})</h4>
      <Table name='tasks'
             defaultSort={{ id: 'id' }}
             data={this.data.tasks}
             columns={columns} />
    </div>;
  }
});
