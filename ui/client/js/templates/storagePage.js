
storageLevelToNum = function(sl) {
  return ['UseMemory', 'UseExternalBlockStore', 'UseDisk', 'Deserialized'].reduce(function(s, e) {
    return 2*s + sl[e]
  }, sl['Replication']);
};

var columns = [
  { id: 'id', label: 'RDD ID', cmpFn: sortBy("id") },
  { id: 'storageLevel', label: 'Storage Level', cmpFn: sortBy(storageLevelToNum) },
  { id: 'cachedPartitions', label: 'Cached Partitions', cmpFn: sortBy("cachedPartitions") },
  { id: 'fractionCached', label: '% Cached', cmpFn: sortBy(function(rdd) { return rdd.numCachedPartitions / rdd.numPartitions; }) },
  { id: 'memSize', label: 'Size in Memory', cmpFn: sortBy("") },
  { id: 'offHeapSize', label: 'Size in Tachyon', cmpFn: sortBy("") },
  { id: 'diskSize', label: 'Size on Disk', cmpFn: sortBy("") }
];

var columnsById = {};
columns.forEach(function(column) {
  columnsById[column.id] = column;
  column.template = 'rddRow-' + column.id;
  column.table = 'rdd-table';
});

Template.storagePage.helpers({
  columns: columns,
  sorted: function() {
    var sort = Session.get('rdd-table-sort') || ['id', 1];
    var cmpFn = columnsById[sort[0]].cmpFn;
    var arr = this.rdds.map(identity);
    if (cmpFn) {
      return sort[1] == 1 ? arr.sort(cmpFn) : arr.sort(cmpFn).reverse();
    } else {
      return sort[1] == 1 ? arr.sort() : arr.sort().reverse();
    }
  }
});

Template['rddRow-storageLevel'].helpers({
  getStorageLevel: getStorageLevel
});

fractionCached = function(rdd) {
  return ((rdd.numCachedPartitions / rdd.numPartitions) || 0) * 100 + '%';
};
Template['rddRow-fractionCached'].helpers({
  fractionCached: fractionCached
});
