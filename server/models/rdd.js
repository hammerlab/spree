
var mixinMongoMethods = require("../utils").mixinMongoMethods;

function RDD(appId, id) {
  this.appId = appId;
  this.id = id;
  this.findObj = { appId: appId, id: id };
  this.propsObj = {};
  this.toSyncObj = {};
  this.dirty = true;
}

mixinMongoMethods(RDD, "RDD", "RDDs");

RDD.prototype.fromRDDInfo = function(ri) {
  return this.set({
    name: ri['Name'],
    parentIDs: ri['Parent IDs'],
    storageLevel: ri['Storage Level'],
    numPartitions: ri['Number of Partitions'],
    numCachedPartitions: ri['Number of Cached Partitions'],
    memSize: ri['Memory Size'],
    externalBlockStoreSize: ri['ExternalBlockStore Size'],
    diskSize: ri['Disk Size'],
    scope: ri['Scope']
  });
};

module.exports.RDD = RDD;
