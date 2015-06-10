
var mixinMongoMethods = require("../utils").mixinMongoMethods;

function TaskAttempt(appId, id, index, attemptId) {
  this.appId = appId;
  this.id = id;
  this.index = index;
  this.attemptId = attemptId;

  this.findObj = { appId: appId, id: id };
  this.propsObj = {};
  this.toSyncObj = {};
  this.dirty = true;

}

mixinMongoMethods(TaskAttempt, "TaskAttempt", "TaskAttempts");

module.exports.TaskAttempt = TaskAttempt;
