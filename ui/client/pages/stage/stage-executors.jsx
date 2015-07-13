
// Per-executor table

StageExecutorsTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    return {
      numExecutors: Executors.find().count()
    };
  },
  render() {
    var executorColumns = [
      new Column('id', 'Executor ID', 'execId', { truthyZero: true }),
      new Column('host', 'Host', 'host'),
      new Column('port', 'Port', 'port', { showByDefault: false }),
      taskTimeColumn
    ]
          .concat(taskColumns)
          .concat(ioColumns);

    return <Table
          title={"Executors"}
          name='stageExecutors'
          defaultSort={{ id: 'id' }}
          collection={StageExecutors}
          totalCollection="NumStageExecutors"
          columns={executorColumns}
          />;
  }
});


