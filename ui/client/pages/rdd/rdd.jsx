
// RDD Page
Router.route("/a/:_appId/rdd/:_rddId", {
  waitOn: function() {
    var appId = this.params._appId;
    var rddId = parseInt(this.params._rddId);
    return [
      Meteor.subscribe('rdd-page', appId, rddId),
      Meteor.subscribe('num-rdd-executors', appId, rddId),
      Meteor.subscribe('num-rdd-blocks', appId, rddId)
    ];
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
  },
  name: 'rdd'
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
    return [
      executorIdColumn,
      hostColumn,
      portColumn,
      numBlocksColumn.copy({ requireOracle: 'numCachedPartitions' })
    ].concat(spaceColumns);
  },
  subscriptionFn: (appId, rddId) => {
    return (opts) => {
      return Meteor.subscribe("rdd-executors", appId, rddId, opts);
    };
  }
});


// RDD per-partition table
var blockColumns = [
  blockIdColumn,
  executorIdColumn,
  storageLevelColumn
]
      .concat(spaceColumns)
      .concat([ hostColumn, portColumn ]);

Template.rddPartitionsTable.helpers({
  columns: function() {
    return blockColumns;
  },
  subscriptionFn: (appId, rddId) => {
    return (opts) => {
      return Meteor.subscribe("rdd-blocks", appId, rddId, opts);
    };
  }
});
