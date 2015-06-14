
Template.storagePage.helpers({
  getStorageLevel: getStorageLevel,

  fractionCached: function(rdd) {
    return ((rdd.numCachedPartitions / rdd.numPartitions) || 0) * 100 + '%';
  }
});
