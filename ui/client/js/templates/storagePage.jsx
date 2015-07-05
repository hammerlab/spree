
var columns = [
  {
    id: 'id',
    label: 'RDD ID',
    sortBy: "id",
    render: function(rdd) {
      var href = [ "", "a", rdd.appId, "rdd", rdd.id ].join('/');
      return <a href={href}>{rdd.id}</a>;
    },
    renderKey: ''
  },
  {
    id: 'name',
    label: 'RDD Name',
    sortBy: 'name',
    render: function(rdd) {
      var href = [ "", "a", rdd.appId, "rdd", rdd.id ].join('/');
      return <a href={href}>{rdd.name}</a>;
    },
    renderKey: ''
  },
  storageLevelColumn,
  { id: 'numCachedPartitions', label: 'Cached Partitions', sortBy: "numCachedPartitions" },
  {
    id: 'fractionCached',
    label: '% Cached',
    sortBy: function(rdd) {
      return rdd.numCachedPartitions / rdd.numPartitions;
    },
    render: function(f) {
      return (parseInt(f * 100) || 0) + '%';
    }
  }
].concat(spaceColumns);

Template.storagePage.helpers({
  columns: function() { return columns; }
});
