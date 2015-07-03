

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

var statsColumns = processColumns(
      [
        { id: 'id', label: 'Metric', sortBy: 'id', template: 'id' },
        { id: 'min', label: 'Min', sortBy: 'min' },
        { id: 'tf', label: '25th Percentile', sortBy: 'tf' },
        { id: 'median', label: 'Median', sortBy: 'median' },
        { id: 'sf', label: '75th Percentile', sortBy: 'sf' },
        { id: 'max', label: 'Max', sortBy: 'max' }
      ],
      'summaryMetricsTable',
      'summaryMetrics'
);

//makeTable(statsColumns, 'summaryStatsTable', 'summaryStats', 'stats');

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
      <RowTable
            defaultSort={ { id: 'id', fn: acc('id'), dir: 1 } }
            sortKey='summary-table-sort'
            data={this.props.stats}
            columns={statsColumns}
            class="stats"
            />
    </div>;
  }
});

// Per-executor table
var executorColumns = processColumns(
      [
        { id: 'id', label: 'Executor ID', sortBy: 'id', template: 'id' },
        { id: 'address', label: 'Address', sortBy: getHostPort },
        taskTimeColumn
      ]
            .concat(taskColumns)
            .concat(ioColumns),
      'executorsTable',
      'executor'
);

//makeTable(executorColumns, 'executorTable', 'stageExec', StageExecs);

statusStr = function(status) {
  return statuses[status];
};

// Per-task table
var columns = processColumns(
      [
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
            ]),
      'tasksTable',
      'task'
);

Template.tasksTable.helpers({
  //eTasks: function() {
  //  var eById = {};
  //  Executors.find().forEach(function(e) {
  //    eById[e.id] = e;
  //  });
  //  return TaskAttempts.find();
  //},
  //numETasks: function() {
  //  return ETasks.find().count();
  //},
  //getTasks: function() {
  //  var tasks = [];
  //  for (var id in this.tasks) {
  //    tasks.push(this.tasks[id]);
  //  }
  //  return tasks;
  //},
  //numTasks: function() {
  //  return TaskAttempts.find().count();
  //},
});

//makeTable(columns, 'tasksTable', 'task');

Template['taskRow-status'].helpers({
  status: function(task) {
    return statuses[task.status];
  }
});

Template.reactStagePage.helpers({
  StagePage: () => { return StagePage; }
});

StagePage = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    return {
      stage: StageAttempts.find().fetch()[0]
    };
  },
  render() {
    var s = this.data.stage;
    return <div className="container-fluid">
      <h3>Details for Stage {s.stageId}, Attempt {s.id}</h3>
      <TasksTable />
    </div>;
  }
});

ExecutorsTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
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
      <Table defaultSort={ { id: 'id', fn: acc('id'), dir: 1 } } sortKey='executors-table-sort' data={this.data.executors} columns={executorColumns} />
    </div>;
  }
});

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
    return {
      tasks: TaskAttempts.find().fetch()
    };
  },
  render() {
    return <div>
      <h4>Tasks ({this.data.tasks && this.data.tasks.length || 0})</h4>
      <Table defaultSort={ { id: 'id', fn: acc('id'), dir: 1 } } sortKey='tasks-table-sort' data={this.data.tasks} columns={columns} />
    </div>;
  }
});
