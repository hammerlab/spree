
var mixinMongoMethods = require("../utils").mixinMongoMethods;

function Task(appId, jobId, stageId, stageAttemptId, index) {
  this.appId = appId;
  this.jobId = jobId;
  this.stageId = stageId;
  this.stageAttemptId = stageAttemptId;
  this.index = index;

  this.findObj = { appId: appId, stageId: stageId, stageAttemptId: stageAttemptId, index: index };
  this.propsObj = {};
  this.toSyncObj = {};
  this.dirty = true;

  this.set({
    attempts: {},
    numAttempts: 0,
    'attemptCounts.running': 0,
    'attemptCounts.failed': 0,
    'attemptCounts.succeeded': 0
  });

}

mixinMongoMethods(Task, "Task", "Tasks");

module.exports.Task = Task;
