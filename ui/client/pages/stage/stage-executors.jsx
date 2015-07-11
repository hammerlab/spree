
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
      new Column('id', 'Executor ID', 'id', { truthyZero: true }),
      new Column('host', 'Host', 'host'),
      new Column('port', 'Port', 'port', { showByDefault: false }),
      taskTimeColumn.prefix(stageKey)
    ]
          .concat(taskColumns.map((c) => { return c.prefix(stageKey); }))
          .concat(ioColumns.map((c) => { return c.prefix(stageKey) }));

    return <Table
          title={"Executors"}
          name='stage-executors'
          defaultSort={{ id: 'id' }}
          collection={Executors}
          totalCollection="NumExecutors"
          columns={executorColumns}
          />;
  }
});


