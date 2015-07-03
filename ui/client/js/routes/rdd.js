
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

