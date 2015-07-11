
// RDD Page
Router.route("/a/:_appId/rdd/:_rddId", {
  waitOn: function() {
    return Meteor.subscribe('rdd-page', this.params._appId, parseInt(this.params._rddId));
  },
  action: function() {
    this.render('rddPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        rdd: RDDs.findOne(),
        storageTab: 1
      }
    });
  }
});


Template.rddPage.helpers({
  setTitle: function(rdd) {
    if (rdd) document.title = "RDD " + rdd.name + " (ID " + rdd.id + ") - Spark";
    return null;
  }
});


// RDD per-executor-stats table
Template.rddExecutorsTable.helpers({
  columns: function() {
    var rddKey = this.rdd ? ['blocks', 'rdd', this.rdd.id].join('.') : '';
    return [
      hostColumn,
      portColumn,
      numBlocksColumn.prefix(rddKey),
      memColumn.prefix(rddKey),
      offHeapColumn.prefix(rddKey),
      diskColumn.prefix(rddKey)
    ];
  },
  title: function() {
    return "Data Distribution on " + Executors.find().count() + " Executors";
  }
});


// RDD per-partition table
var blockColumns = [
  new Column('id', 'Block ID', 'id', { truthyZero: true }),
  storageLevelColumn
]
      .concat(spaceColumns)
      .concat([ hostColumn, portColumn ]);

Template.rddPartitionsTable.helpers({
  columns: function() {
    return blockColumns;
  },
  title: function() {
    return (this.rdd ? this.rdd.numCachedPartitions : 0) + " Partitions";
  }
});
