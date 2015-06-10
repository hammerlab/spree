
Template.storagePage.helpers({
  getStorageLevel: function(sl) {
    return [
      (sl.useMemory ? "Memory" : (sl.useOffHeap ? "Tachyon" : (sl.useDisk ? "Disk" : "???"))),
      sl.deserialized ? "Deserialized" : "Serialized",
      sl.replication + "x Replicated"
    ].join(" ");
  },

  fractionCached: function(rdd) {
    return ((rdd.numCachedPartitions / rdd.numPartitions) || 0) * 100 + '%';
  }
});
