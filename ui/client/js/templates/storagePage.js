
var columns = [
  { id: 'id', label: 'RDD ID', cmpFn: sortBy("id") },
  storageLevelColumn,
  { id: 'cachedPartitions', label: 'Cached Partitions', cmpFn: sortBy("cachedPartitions") },
  { id: 'fractionCached', label: '% Cached', cmpFn: sortBy(function(rdd) { return rdd.numCachedPartitions / rdd.numPartitions; }) }
].concat(spaceColumns);

var columnsById = byId(columns, 'rddRow', 'rdd');

Template.storagePage.helpers({
  columns: columns,
  sorted: function() {
    var sort = Session.get('rdd-table-sort') || ['id', 1];
    var cmpFn = columnsById[sort[0]].cmpFn;

    var arr = this.rdds.map(function(rdd) {
      rdd.appId = this.appId;
      return rdd;
    }.bind(this));

    if (cmpFn) {
      return sort[1] == 1 ? arr.sort(cmpFn) : arr.sort(cmpFn).reverse();
    } else {
      return sort[1] == 1 ? arr.sort() : arr.sort().reverse();
    }
  }
});


fractionCached = function(rdd) {
  return ((rdd.numCachedPartitions / rdd.numPartitions) || 0) * 100 + '%';
};
Template['rddRow-fractionCached'].helpers({
  fractionCached: fractionCached
});
