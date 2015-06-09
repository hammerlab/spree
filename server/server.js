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

function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

function upsert(collection, cbName, find, $set) {
  collection.findOneAndUpdate(
        find,
        { $set: $set },
        upsertOpts,
        upsertCb(cbName)
  );
}

var handlers = {

  "SparkListenerApplicationStart": function(e) {
    var o = {
      name: e['App Name'],
      'time.start': e['Timestamp'],
      user: e['User']
    };
    if (e['App Attempt ID']) {
      o.attempt = e['App Attempt ID'];
    }
    upsert(Applications, "SparkListenerApplicationStart", { id: e['App ID'] }, o);
  },

  "SparkListenerApplicationEnd": function(e) {
    upsert(
          Applications,
          "SparkListenerApplicationEnd",
          { id: e['appId'] },
          { 'time.end': e['Timestamp'] }
    );
  },

  "SparkListenerJobStart": function(e) {
    var stageIDs = e['Stage IDs'];
    var stageInfos = e['Stage Infos'];

    var rddInfos = {};
    var numTasks = 0;
    stageInfos.forEach(function(si) {

      si['RDD Info'].map(function(ri) {
        rddInfos[ri['RDD ID']] = ri;
      });

      var o = {
        name: si['Stage Name'],
        'taskCounts.num': si['Number of Tasks'],
        rddIDs: si['RDD Info'].map(function (ri) {
          return ri['RDD ID]'];
        }),
        parents: si['Parent IDs'],
        details: si['Details'],
        //time: { start: si['Submission Time'], end: si['Completion Time'] },
        failureReason: si['Failure Reason'],
        accumulables: si['Accumulables']
      };

      if (si['Submission Time']) {
        o['time.start'] = si['Submission Time'];
      }
      if (si['Completion Time']) {
        o['time.end'] = si['Completion Time'];
      }

      upsert(
            Stages,
            "SparkListenerJobStart -> Stage",
            { appId: e['appId'], id: si['Stage ID'], attempt: si['Stage Attempt ID'] },
            o
      );

      numTasks += si['Number of Tasks'];
    });

    var o = {
      'time.start': e['Submission Time'],
      stageIDs: stageIDs,
      started: true,
      'taskCounts.num': numTasks,
      'stageCounts.num': stageIDs.length
    };
    if (!isEmptyObject(e['Properties'])) {
      o.properties = e['Properties'];
    }

    upsert(Jobs, "SparkListenerJobStart", { appId: e['appId'], id: e['Job ID'] }, o);

    var rid;
    for (rid in rddInfos) {
      var ri = rddInfos[rid];
      upsert(
            RDDs,
            "SparkListenerJobStart -> RDD",
            { appId: e['appId'], id: rid },
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
            }
      );
    }

  },

  "SparkListenerJobEnd": function(e) {
    upsert(
          Jobs,
          "SparkListenerJobEnd",
          { appId: e['appId'], id: e['Job ID'] },
          {
            'time.end': e['Completion Time'],
            result: e['Job Result'],
            succeeded: e['Job Result']['Result'] == 'JobSucceeded',
            ended: true
          }
    );
  },

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

  "SparkListenerEnvironmentUpdate": function(e) {

  },
  "SparkListenerBlockManagerAdded": function(e) {

  },
  "SparkListenerBlockManagerRemoved": function(e) {

  },
  "SparkListenerUnpersistRDD": function(e) {

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

  Applications = db.collection('apps');
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
