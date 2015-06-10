
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
  //this.set({
  //  attempts: {},
  //  numAttempts: 0,
  //  'attemptCounts.running': 0,
  //  'attemptCounts.failed': 0,
  //  'attemptCounts.succeeded': 0
  //});

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

//Stage.prototype.processAttemptRunning = function(attemptId) {
//  var status = this.get('status');
//  if (status != SUCCEEDED) {
//    return this.set('status', RUNNING, true);
//  }
//  console.log("Ignoring attempt " + attemptId + " RUNNING because stage " + this.id + " already SUCCEEDED");
//  return this;
//};
//
//Stage.prototype.processAttemptSucceeded = function(attemptId) {
//  this.set('status', SUCCEEDED, true);
//};
//
//Stage.prototype.markFailed = function(attemptId) {
//  if (this.get('status') == SUCCEEDED) {
//  } else {
//    this.set('status', FAILED);
//  }
//
//  this.set('attempts.' + attemptId, RUNNING);
//  this.inc('numRunning', 1);
//};

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
