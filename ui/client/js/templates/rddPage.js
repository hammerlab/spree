
Template.rddPage.helpers({

  setTitle: function(rdd) {
    if (rdd) document.title = "RDD " + rdd.name + " (ID " + rdd.id + ") - Spark";
    return null;
  },

  subtractBytes: function(a, b) { return formatBytes(a - b); }
});

var rddExecColumns = [
  hostColumn,
  portColumn,
  numBlocksColumn,
  memColumn,
  offHeapColumn,
  diskColumn
];

Template.rddExecutorsTable.helpers({
  columns: function() {
    return rddExecColumns;
  },
  title: function() {
    return "Data Distribution on " + Executors.find().count() + " Executors";
  }
});

var blockColumns = [
  { id: 'id', label: 'Block ID', sortBy: "id", template: 'id' },
  storageLevelColumn
]
      .concat(spaceColumns)
      .concat([ hostColumn, portColumn ]);

Template.rddPartitionsTable.helpers({
  columns: function() {
    return blockColumns;
  },
  title: function() {
    return this.rdd.numCachedPartitions + " Partitions";
  },
  blocks: function() {
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
    return blocks;
  }
});
