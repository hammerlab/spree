
var columns = [
  { id: 'id', label: 'ID', cmpFn: sortBy('id'), template: 'id' },
      hostColumn,
      portColumn,
      numBlocksColumn,
  { id: 'mem', label: 'Memory Usage', cmpFn: sortBy('MemorySize') },
  diskColumn,
  offHeapColumn
]
      .concat(taskColumns)
      .concat([
        { id: 'taskTime', label: 'Task Time', cmpFn: sortBy('ExecutorRunTime') }
      ])
      .concat(ioBytesColumns)
      .concat([
        { id: 'threadDump', label: 'Thread Dump' }
      ]);

makeTable(
      columns, 'executorsPage', 'sorted', 'columns', 'execRow', 'exec', function() { return this.executors.map(identity); }, ['id', -1]
);

Template.executorsPage.helpers({
  numExecutors: function() {
    return Executors.find().count();
  }
});
