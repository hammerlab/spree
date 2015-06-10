
var assert = require('assert');

var MongoClient = require('mongodb').MongoClient;

var l = require('./log').l;

module.exports = {
  // Mongo collection placeholders.
  Applications: null,
  Jobs: null,
  Stages: null,
  StageAttempts: null,
  RDDs: null,
  Executors: null,
  Tasks: null,
  TaskAttempts: null
};

module.exports.init = function(url, cb) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    l.info("Connected correctly to server");

    module.exports.Applications = db.collection('apps');
    module.exports.Jobs = db.collection('jobs');
    module.exports.Stages = db.collection('stages');
    module.exports.StageAttempts = db.collection('stage_attempts');
    module.exports.RDDs = db.collection('rdds');
    module.exports.Executors = db.collection('executors');
    module.exports.Tasks = db.collection('tasks');
    module.exports.TaskAttempts = db.collection('task_attempts');

    cb(db);
  });
};

