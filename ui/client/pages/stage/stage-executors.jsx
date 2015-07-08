
// Per-executor table

StageExecutorsTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    return {
      numExecutors: Executors.find().count()
    };
  },
  render() {
    var stageKey = ['stages', this.props.stageId, this.props.attemptId].join('.');
    var executorColumns = [
      { id: 'id', label: 'Executor ID', sortBy: 'id' },
      { id: 'host', label: 'Host', sortBy: 'host', showByDefault: false },
      { id: 'port', label: 'Port', sortBy: 'port', showByDefault: false },
      taskTimeColumn(stageKey)
    ]
          .concat(taskColumns(stageKey))
          .concat(ioColumns(stageKey));

    return <Table
          title={"Executors (" + this.data.numExecutors + ")"}
          name='executors'
          defaultSort={{ id: 'id' }}
          collection={Executors}
          columns={executorColumns} />
          ;
  }
});


