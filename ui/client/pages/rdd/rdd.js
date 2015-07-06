
// RDD Page
Router.route("/a/:_appId/rdd/:_rddId", {
  waitOn: function() {
    return Meteor.subscribe('rdd-page', this.params._appId, parseInt(this.params._rddId));
  },
  action: function() {
    var executors = Executors.find().map(function(executor) {
      var executorRDD = executor.blocks.rdd[this.params._rddId];
      ['MemorySize', 'ExternalBlockStoreSize', 'DiskSize', 'numBlocks'].forEach(function(key) {
        if (key in executorRDD) {
          executor[key] = executorRDD[key];
        }
      }.bind(this));
      if ('blocks' in executorRDD) {
        executor['blocks'] = executorRDD['blocks'];
      } else {
        delete executor['blocks'];
      }
      return executor;
    }.bind(this));

    this.render('rddPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        rdd: RDDs.findOne(),
        executors: executors,
        storageTab: 1
      }
    });
  }
});


Template.rddPage.helpers({

  setTitle: function(rdd) {
    if (rdd) document.title = "RDD " + rdd.name + " (ID " + rdd.id + ") - Spark";
    return null;
  },

  subtractBytes: function(a, b) { return formatBytes(a - b); }
});


// RDD per-executor-stats table
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


// RDD per-partition table
var blockColumns = [
  { id: 'id', label: 'Block ID', sortBy: "id" },
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
