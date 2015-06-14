
Template.storagePage.helpers({
  getStorageLevel: function(sl) {
    return [
      (sl.UseMemory ? "Memory" : (sl.UseExternalBlockStore ? "Tachyon" : (sl.UseDisk ? "Disk" : "???"))),
      sl.Deserialized ? "Deserialized" : "Serialized",
      sl.Replication + "x Replicated"
    ].join(" ");
  },

  fractionCached: function(rdd) {
    return ((rdd.numCachedPartitions / rdd.numPartitions) || 0) * 100 + '%';
  }
});
