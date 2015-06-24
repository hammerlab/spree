
var columns = [
  { id: 'id', label: 'RDD ID', cmpFn: sortBy("id") },
  nameColumn,
  storageLevelColumn,
  { id: 'cachedPartitions', label: 'Cached Partitions', cmpFn: sortBy("cachedPartitions") },
  { id: 'fractionCached', label: '% Cached', cmpFn: sortBy(function(rdd) { return rdd.numCachedPartitions / rdd.numPartitions; }) }
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
