
var rddExecColumns = [
  hostColumn,
  portColumn,
  numBlocksColumn,
  memColumn,
  offHeapColumn,
  diskColumn
];

makeTable(
      rddExecColumns, 'rddPage', 'sortedExecutors', 'execColumns', 'rddExec', 'rddExec', function() { return this.executors.map(identity); }, ['host', 1]
);

var blockColumns = [
  { id: 'id', label: 'Block ID', sortBy: "id", template: 'id' },
  storageLevelColumn
]
      .concat(spaceColumns)
      .concat([ hostColumn, portColumn ]);

makeTable(
      blockColumns, 'rddPage', 'sortedBlocks', 'blockColumns', 'blocks', 'blocks', function() {
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
      }, ['id', 1]
);


Template.rddPage.helpers({

  setTitle: function(rdd) {
    if (rdd) document.title = "RDD " + rdd.name + " (ID " + rdd.id + ") - Spark";
    return null;
  },

  numExecutors: function() {
    return Executors.find().count();
  },

  subtractBytes: function(a, b) { return formatBytes(a - b); }
});
