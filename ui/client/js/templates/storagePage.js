
var columns = [
  { id: 'id', label: 'RDD ID', sortBy: "id" },
  { id: 'name', label: 'RDD Name', sortBy: 'name' },
  storageLevelColumn,
  { id: 'numCachedPartitions', label: 'Cached Partitions', sortBy: "numCachedPartitions" },
  { id: 'fractionCached', label: '% Cached', sortBy: function(rdd) { return rdd.numCachedPartitions / rdd.numPartitions; } }
].concat(spaceColumns);

makeTable(
      columns, 'storagePage', 'sorted', 'columns', 'rddRow', 'rdd', 'rdds', ['id', 1]
);

fractionCached = function(rdd) {
  return ((rdd.numCachedPartitions / rdd.numPartitions) || 0) * 100 + '%';
};
Template['rddRow-fractionCached'].helpers({
  fractionCached: fractionCached
});
