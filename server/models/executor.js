
var mixinMongoMethods = require("../utils").mixinMongoMethods;

function Executor(appId, id) {
  this.appId = appId;
  this.id = id;
  this.findObj = { appId: appId, id: id };
  this.propsObj = {};
  this.toSyncObj = {};
  this.dirty = true;
}

mixinMongoMethods(Executor, "Executor", "Executors");

module.exports.Executor = Executor;
