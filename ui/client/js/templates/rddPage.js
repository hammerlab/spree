
var rddExecColumns = [
  hostColumn,
      portColumn,
      numBlocksColumn,
      memColumn,
      offHeapColumn,
      diskColumn
];

var rddExecColumnsById = byId(rddExecColumns, 'rddExec', 'rddExec');

var blockColumns = [
  { id: 'id', label: 'Block ID', cmpFn: sortBy("id"), template: 'id' },
  storageLevelColumn
]
      .concat(spaceColumns)
      .concat([ hostColumn, portColumn ]);

var blockColumnsById = byId(blockColumns, 'blocks', 'blocks');

Template.rddPage.helpers({

  setTitle: function(rdd) {
    if (rdd) document.title = "RDD " + rdd.name + " (ID " + rdd.id + ") - Spark";
    return null;
  },

  execColumns: rddExecColumns,
  sortedExecutors: function() {
    var execs = this.executors.map(identity);
    var sort = Session.get('rddExec-table-sort') || ['host', 1];  // TODO(ryan): add secondary sort capability.
    var cmpFn = rddExecColumnsById[sort[0]].cmpFn;
    if (cmpFn) {
      return sort[1] == 1 ? execs.sort(cmpFn) : execs.sort(cmpFn).reverse();
    } else {
      return sort[1] == 1 ? execs.sort() : execs.sort().reverse();
    }
  },

  blockColumns: blockColumns,
  sortedBlocks: function() {
    var blocks = [];
    this.executors.forEach(function(executor) {
      for (var blockId in executor.blocks) {
        var block = executor.blocks[blockId];
        block.id = blockId;
        block.host = executor.host;
        block.port = executor.port;
        blocks.push(block);
      }
    });
    var sort = Session.get('blocks-table-sort') || ['id', 1];
    var cmpFn = blockColumnsById[sort[0]].cmpFn;
    if (cmpFn) {
      return sort[1] == 1 ? blocks.sort(cmpFn) : blocks.sort(cmpFn).reverse();
    } else {
      return sort[1] == 1 ? blocks.sort() : blocks.sort().reverse();
    }

  },

  numExecutors: function() {
    return Executors.find().count();
  },

  subtractBytes: function(a, b) { return formatBytes(a - b); }
});
