
var utils = require("../utils");

var StageAttempt = require('./stage-attempt').StageAttempt;
var mixinMongoMethods = utils.mixinMongoMethods;

var RUNNING = utils.RUNNING;
var FAILED = utils.FAILED;
var SUCCEEDED = utils.SUCCEEDED;

function Stage(appId, id) {
  this.appId = appId;
  this.id = id;
  this.dirty = true;

  this.findObj = { appId: appId, id: id };
  this.propsObj = {};
  this.toSyncObj = {};

  this.attempts = {};
}

mixinMongoMethods(Stage, "Stage", "Stages");

Stage.prototype.fromStageInfo = function(si) {
  return this.set({
    name: si['Stage Name'],
    numTasks: si['Number of Tasks'],
    rddIDs: si['RDD Info'].map(function (ri) {
      //console.log("rdd id: " + ri["RDD ID"])
      return ri['RDD ID'];
    }),
    parents: si['Parent IDs'],
    details: si['Details'],
    accumulables: si['Accumulables']
  });
};

Stage.prototype.getAttempt = function(attemptId) {
  if (typeof attemptId == 'object') {
    attemptId = attemptId['Stage Attempt ID'];
  }
  if (!(attemptId in this.attempts)) {
    this.attempts[attemptId] = new StageAttempt(this.appId, this, attemptId);
  }
  return this.attempts[attemptId];
};

module.exports.Stage = Stage;
