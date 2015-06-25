
var columns = [
  { id: 'id', label: 'RDD ID', sortBy: "id" },
  nameColumn,
  storageLevelColumn,
  { id: 'numCachedPartitions', label: 'Cached Partitions', sortBy: "numCachedPartitions" },
  { id: 'fractionCached', label: '% Cached', sortBy: function(rdd) { return rdd.numCachedPartitions / rdd.numPartitions; } }
].concat(spaceColumns);

makeTable(
      columns, 'storagePage', 'sorted', 'columns', 'rddRow', 'rdd', function() { return this.rdds.map(identity); }, ['id', 1]
);

fractionCached = function(rdd) {
  return ((rdd.numCachedPartitions / rdd.numPartitions) || 0) * 100 + '%';
};
Template['rddRow-fractionCached'].helpers({
  fractionCached: fractionCached
});
