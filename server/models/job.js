
var mixinMongoMethods = require("../utils").mixinMongoMethods;

function Job(appId, id) {
  this.appId = appId;
  this.id = id;
  this.findObj = { appId: appId, id: id };
  this.propsObj = {};
  this.toSyncObj = {};
  this.dirty = true;

  //this.set({ stages: {}, tasks: {} });
}

mixinMongoMethods(Job, "Job", "Jobs");

module.exports.Job = Job;
