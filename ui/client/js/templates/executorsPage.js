
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

var columnsById = byId(columns, 'execRow', 'exec');

Template.executorsPage.helpers({
  sorted: function() {
    var execs = this.executors.map(identity);
    var sort = Session.get('exec-table-sort') || ['id', -1];
    var cmpFn = columnsById[sort[0]].cmpFn;
    if (cmpFn) {
      return sort[1] == 1 ? execs.sort(cmpFn) : execs.sort(cmpFn).reverse();
    } else {
      return sort[1] == 1 ? execs.sort() : execs.sort().reverse();
    }
  },

  columns: function() { return columns; },

  numExecutors: function() {
    return Executors.find().count();
  }
});
