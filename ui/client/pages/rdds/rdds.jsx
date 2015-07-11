
// Storage page
Router.route("/a/:_appId/storage", {
  waitOn: function() {
    return Meteor.subscribe("rdds-page", this.params._appId);
  },
  action: function() {
    this.render('rddsPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        storageTab: 1
      }
    });
  }
});

var rddIdColumn = {
  id: 'id',
  label: 'RDD ID',
  sortBy: "id",
  render: function(rdd) {
    var href = [ "", "a", rdd.appId, "rdd", rdd.id ].join('/');
    return <a href={href}>{rdd.id}</a>;
  },
  renderKey: ''
};

var rddNameColumn = {
  id: 'name',
  label: 'RDD Name',
  sortBy: 'name',
  render: function(rdd) {
    var href = [ "", "a", rdd.appId, "rdd", rdd.id ].join('/');
    return <a href={href}>{rdd.name}</a>;
  },
  renderKey: ''
};

var fractionCachedColumn = {
  id: 'fractionCached',
  label: '% Cached',
  sortBy: function(rdd) {
    return rdd.numCachedPartitions / rdd.numPartitions;
  },
  render: function(f) {
    return (parseInt(f * 100) || 0) + '%';
  }
};

var columns = [
  rddIdColumn,
  rddNameColumn,
  storageLevelColumn,
  { id: 'numCachedPartitions', label: 'Cached Partitions', sortBy: "numCachedPartitions" },
  { id: 'numPartitions', label: 'Total Partitions', sortBy: "numPartitions" },
  fractionCachedColumn
].concat(spaceColumns);

Template.rddsPage.helpers({
  columns: function() { return columns; }
});
