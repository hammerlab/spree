
var mixinMongoMethods = require("../utils").mixinMongoMethods;

function StageAttempt(appId, stage, id) {
  this.appId = appId;
  this.stage = stage;
  this.stageId = stage.id;
  this.id = id;
  this.dirty = true;
  this.findObj = { appId: appId, stageId: this.stageId, id: id };
  this.propsObj = {};
  this.toSyncObj = {};

  this.set({ tasks: {} });
}

StageAttempt.prototype.fromStageInfo = function(si) {
  return this.set({
    'time.start': si['Submission Time'],
    'time.end': si['Completion Time'],
    failureReason: si['Failure Reason']
  });
};

mixinMongoMethods(StageAttempt, "StageAttempt", "StageAttempts");

module.exports.StageAttempt = StageAttempt;
