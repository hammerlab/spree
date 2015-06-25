
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
      .concat([ taskTimeColumn ])
      .concat(ioBytesColumns);

makeTable(columns, 'executorsPage', 'exec', 'executors');

Template.executorsPage.helpers({
  numExecutors: function() {
    return Executors.find().count();
  }
});
