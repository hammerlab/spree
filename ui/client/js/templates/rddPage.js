
getStorageLevel = function(sl) {
  return sl && [
    (sl.UseMemory ? "Memory" : (sl.UseExternalBlockStore ? "Tachyon" : (sl.UseDisk ? "Disk" : "???"))),
    sl.Deserialized ? "Deserialized" : "Serialized",
    sl.Replication + "x Replicated"
  ].join(" ") || null;
};

Template.rddPage.helpers({
  getStorageLevel: getStorageLevel,

  setTitle: function(rdd) {
    if (rdd) document.title = "RDD " + rdd.name + " (ID " + rdd.id + ") - Spark";
    return null;
  },

  numExecutors: function() {
    return Executors.find().count();
  },

  executorRDDBlocks: function(executor) {
    var rdd = RDDs.findOne();
    var ret = executor && executor.blocks && executor.blocks.rdd && rdd && executor.blocks.rdd[rdd.id];
    return { execRDD: ret || null, executor: executor, rdd: rdd };
  },

  keys: function(obj, rdd, executor) {
    var arr = [];
    for (k in obj) arr.push({key: k, val: obj[k], rdd: rdd, executor: executor});
    return arr;
  },

  subtractBytes: function(a, b) { return formatBytes(a - b); }
});
