
getStorageLevel = function(sl) {
  return sl && [
          (sl.UseMemory ? "Memory" : (sl.UseExternalBlockStore ? "Tachyon" : (sl.UseDisk ? "Disk" : "???"))),
          sl.Deserialized ? "Deserialized" : "Serialized",
          sl.Replication + "x Replicated"
        ].join(" ") || null;
};
Template.registerHelper('getStorageLevel', getStorageLevel);

storageLevelToNum = function(sl) {
  if ('StorageLevel' in sl) sl = sl['StorageLevel'];
  return ['UseMemory', 'UseExternalBlockStore', 'UseDisk', 'Deserialized'].reduce(function(s, e) {
    return 2*s + sl[e]
  }, sl['Replication'] || 0);
};
