var http = require('http');
var assert = require('assert');

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/spruit';

const SPARK_LISTENER_PORT=8123;

// Mongo collection placeholders.
var Applications = null;
var Jobs = null;
var Stages = null;
var RDDs = null;
var Executors = null;
var Tasks = null;

var upsertOpts = { upsert: true, new: true };
var upsertCb = function(event) {
  return function(err, val) {
    if (err) {
      console.error("ERROR (" + event + "): ", err);
    } else {
      console.log("Added " + event + ": ", val);
    }
  }
};

var handlers = {
  "SparkListenerStageSubmitted": function(e) {

  },
  "SparkListenerStageCompleted": function(e) {

  },
  "SparkListenerTaskStart": function(e) {

  },
  "SparkListenerTaskGettingResult": function(e) {

  },
  "SparkListenerTaskEnd": function(e) {

  },
  "SparkListenerJobStart": function(e) {
    var stageIDs = e['Stage IDs'];
    var stageInfos = e['Stage Infos'];

    var rddInfos = {};
    stageInfos.forEach(function(si) {
      si['RDD Info'].map(function(ri) {
        rddInfos[ri['RDD ID']] = ri;
      });
    });

    Jobs.findOneAndUpdate(
          { app: e['appId'], id: e['Job ID'] },
          {
            $set: {
              time: { start: e['Submission Time'] },
              properties: e['Properties'],
              stageIDs: stageIDs
            }
          },
          upsertOpts,
          upsertCb("SparkListenerJobStart")
    );

    stageInfos.forEach(function(si) {
      Stages.findOneAndUpdate(
            { app: e['appId'], id: si['Stage ID'], attempt: si['Stage Attempt ID'] },
            {
              name: si['Stage Name'],
              numTasks: si['Number of Tasks'],
              rddIDs: si['RDD Info'].map(function(ri) { return ri['RDD ID]']; }),
              parents: si['Parent IDs'],
              details: si['Details'],
              time: { start: si['Submission Time'], end: si['Completion Time'] },
              failureReason: si['Failure Reason'],
              accumulables: si['Accumulables']
            },
            upsertOpts, upsertCb("SparkListenerJobStart -> Stage")
      );
    });

    var rid;
    for (rid in rddInfos) {
      var ri = rddInfos[rid];
      RDDs.findOneAndUpdate(
            { app: e['appId'], id: rid },
            {
              name: ri['Name'],
              parents: ri['Parent IDs'],
              storageLevel: ri['Storage Level'],
              numPartitions: ri['Number of Partitions'],
              numCachedPartitions: ri['Number of Cached Partitions'],
              memSize: ri['Memory Size'],
              externalBlockStoreSize: ri['ExternalBlockStore Size'],
              diskSize: ri['Disk Size'],
              scope: ri['Scope']
            },
            upsertOpts, upsertCb("SparkListenerJobStart -> RDD")
      );
    }

  },
  "SparkListenerJobEnd": function(e) {
    Jobs.findOneAndUpdate(
          { app: e['appId'], id: e['Job ID'] },
          {
            time: { end: e['Completion Time'] },
            result: e['Job Result']
          },
          upsertOpts, upsertCb("SparkListenerJobEnd")
    );
  },
  "SparkListenerEnvironmentUpdate": function(e) {

  },
  "SparkListenerBlockManagerAdded": function(e) {

  },
  "SparkListenerBlockManagerRemoved": function(e) {

  },
  "SparkListenerUnpersistRDD": function(e) {

  },
  "SparkListenerApplicationStart": function(e) {
    var o = {
      name: e['App Name'],
      time: { start: e['Timestamp'] },
      user: e['User']
    };
    if (e['App Attempt ID']) {
      o.attempt = e['App Attempt ID'];
    }
    Applications.findOneAndUpdate(
          { id: e['App ID'] },
          { $set: o },
          upsertOpts,
          upsertCb("SparkListenerApplicationStart")
    );
  },
  "SparkListenerApplicationEnd": function(e) {
    Applications.findOneAndUpdate(
          { id: e['appId'] },
          { time: { end: e['Timestamp'] } },
          upsertOpts,
          upsertCb("SparkListenerApplicationEnd")
    );
  },
  "SparkListenerExecutorAdded": function(e) {

  },
  "SparkListenerExecutorRemoved": function(e) {

  },
  "SparkListenerLogStart": function(e) {

  },
  "SparkListenerExecutorMetricsUpdate": function(e) {

  }
};

//We need a function which handles requests and send response
function handleRequest(request, response) {
  var d = '';
  request.on('data', function(chunk) {
    d += chunk;
  });
  request.on('end', function() {
    if (d) {
      var e = JSON.parse(d);
      console.log('Got data: ' + d);
      handlers[e['Event']](e)
    }
    response.end('OK');
  });
}

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");

  Applications = db.collection('applications');
  Jobs = db.collection('jobs');
  Stages = db.collection('stages');
  RDDs = db.collection('rdds');
  Executors = db.collection('executors');
  Tasks = db.collection('tasks');

  var server = http.createServer(handleRequest);

  server.listen(SPARK_LISTENER_PORT, function() {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", SPARK_LISTENER_PORT);
  });

  //db.close();
});
