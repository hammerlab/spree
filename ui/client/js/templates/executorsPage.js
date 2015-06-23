
var columns = [
  { id: 'id', label: 'ID', cmpFn: sortBy('id') },
  { id: 'host', label: 'Host', cmpFn: sortBy('host') },
  { id: 'port', label: 'Port', cmpFn: sortBy('port') },
  { id: 'blocks', label: 'RDD Blocks', cmpFn: sortBy('numBlocks') },
  { id: 'mem', label: 'Memory Usage', cmpFn: sortBy('MemorySize') },
  { id: 'disk', label: 'Disk Usage', cmpFn: sortBy('DiskSize') },
  { id: 'offHeap', label: 'Off Heap Usage', cmpFn: sortBy('ExternalBlockStoreSize') },
  { id: 'activeTasks', label: 'Active Tasks', cmpFn: sortBy('taskCounts.running') },
  { id: 'failedTasks', label: 'Failed Tasks', cmpFn: sortBy('taskCounts.failed') },
  { id: 'completeTasks', label: 'Complete Tasks', cmpFn: sortBy('taskCounts.succeeded') },
  { id: 'totalTasks', label: 'Total Tasks', cmpFn: sortBy('taskCounts.num') },
  { id: 'taskTime', label: 'Task Time', cmpFn: sortBy('ExecutorRunTime') },
  { id: 'input', label: 'Input', cmpFn: sortBy('metrics.InputMetrics.BytesRead') },
  { id: 'output', label: 'Output', cmpFn: sortBy('metrics.OutputMetrics.BytesWritten') },
  { id: 'shuffleRead', label: 'Shuffle Read', cmpFn: shuffleBytesReadCmp() },
  { id: 'shuffleWrite', label: 'Shuffle Write', cmpFn: sortBy('metrics.ShuffleWriteMetrics.ShuffleBytesWritten') },
  { id: 'threadDump', label: 'Thread Dump' }
];

var columnsById = {};
columns.forEach(function(column) {
  columnsById[column.id] = column;
  column.template = 'execRow-' + column.id;
  column.table = 'exec-table';
});

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

Template['execRow-taskTime'].helpers({
  taskTime: function() {
    // TODO(ryan): this is not exactly how existing Spark UI is calculating this.
    return this.metrics.ExecutorRunTime + this.metrics.ExecutorDeserializeTime;
  }
});
