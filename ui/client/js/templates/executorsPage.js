
var columns = [
  { id: 'id', label: 'ID', sortBy: 'id', template: 'id' },
      hostColumn,
      portColumn,
      numBlocksColumn,
  { id: 'mem', label: 'Memory Usage', sortBy: 'MemorySize' },
  diskColumn,
  offHeapColumn
]
      .concat(taskColumns)
      .concat([
        { id: 'taskTime', label: 'Task Time', sortBy: 'metrics.ExecutorRunTime' }
      ])
      .concat(ioBytesColumns);

makeTable(
      columns, 'executorsPage', 'sorted', 'columns', 'execRow', 'exec', function() { return this.executors.map(identity); }, ['id', -1]
);

Template.executorsPage.helpers({
  numExecutors: function() {
    return Executors.find().count();
  }
});
