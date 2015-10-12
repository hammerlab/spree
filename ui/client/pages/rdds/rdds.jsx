
// Storage page
Router.route("/a/:_appId/storage", {
  waitOn: function() {
    return [
      Meteor.subscribe("app", this.params._appId),
      Meteor.subscribe("num-rdds", this.params._appId)
    ];
  },
  action: function() {
    this.render('rddsPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        storageTab: 1
      }
    });
  },
  name: 'rdds'
});

var rddIdColumn = new Column(
      'id',
      'RDD ID',
      "id",
      {
        render: function(rdd) {
          var href = [ "", "a", rdd.appId, "rdd", rdd.id ].join('/');
          return <a href={href}>{rdd.id}</a>;
        },
        renderKey: ''
      }
);

var rddNameColumn = new Column(
      'name',
      'RDD Name',
      'name',
      {
        render: function(rdd) {
          var href = [ "", "a", rdd.appId, "rdd", rdd.id ].join('/');
          return <a href={href}>{rdd.name}</a>;
        },
        renderKey: ''
      }
);

var fractionCachedColumn = new Column(
      'fractionCached',
      '% Cached',
      'fractionCached',
      {
        render: function(f) {
          return (parseInt(f * 100) || 0) + '%';
        }
      }
);

var columns = [
  rddIdColumn,
  rddNameColumn,
  storageLevelColumn,
  new Column('numCachedPartitions', 'Cached Partitions', "numCachedPartitions"),
  new Column('numPartitions', 'Total Partitions', "numPartitions"),
  fractionCachedColumn
].concat(spaceColumns);

Template.rddsPage.helpers({
  columns: function() { return columns; },
  subscriptionFn: (appId) => {
    return (opts) => {
      return Meteor.subscribe("rdds", appId, opts);
    };
  }
});
