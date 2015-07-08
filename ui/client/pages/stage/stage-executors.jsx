
// Per-executor table
var executorColumns = [
  { id: 'id', label: 'Executor ID', sortBy: 'id' },
  { id: 'address', label: 'Address', sortBy: getHostPort },
  { id: 'host', label: 'Host', sortBy: 'host', showByDefault: false },
  { id: 'port', label: 'Port', sortBy: 'port', showByDefault: false },
  taskTimeColumn
]
      .concat(taskColumns)
      .concat(ioColumns);

StageExecutorsTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    // Pull the data relevant to this stage from the executor's "stages" field out to the top level.
    return {
      executors: Executors.find().fetch().map((e) => {
        if (e.stages && this.props.stageId in e.stages) {
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
    return <Table
          title={"Executors (" + (this.data.executors && this.data.executors.length || 0) + ")"}
          name='executors'
          defaultSort={{ id: 'id' }}
          data={this.data.executors}
          columns={executorColumns} />
          ;
  }
});


