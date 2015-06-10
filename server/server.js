
var http = require('http');
var extend = require('node.extend');

var url = 'mongodb://localhost:27017/spruit';

var getApp = require('./models/app').getApp;
var colls = require('./collections');

var utils = require("./utils");

var l = require('./log').l;

var RUNNING = utils.RUNNING;
var FAILED = utils.FAILED;
var SUCCEEDED = utils.SUCCEEDED;
var SKIPPED = utils.SKIPPED;

var handlers = {

  SparkListenerApplicationStart: function(e) {
    getApp(e['appId']).fromEvent(e).upsert();
  },

  SparkListenerApplicationEnd: function(e) {
    getApp(e).set('time.end', e['Timestamp']).upsert();
  },

  SparkListenerJobStart: function(e) {
    var app = getApp(e);
    var job = app.getJob(e);
    var numTasks = 0;

    var stageInfos = e['Stage Infos'];

    stageInfos.forEach(function(si) {

      var stage = app.getStage(si['Stage ID']).fromStageInfo(si).set('jobId', job.id).upsert();
      app.stageIDstoJobIDs[si['Stage ID']] = job.id;

      var attempt = stage.getAttempt(stage.id).fromStageInfo(si).upsert();

      si['RDD Info'].forEach(function(ri) {
        app.getRDD(ri['RDD ID']).fromRDDInfo(ri).upsert();
      }.bind(this));

      numTasks += si['Number of Tasks'];
    });

    job.set({
      'time.start': e['Submission Time'],
      stageIDs: e['Stage IDs'],
      'taskCounts.num': numTasks,
      'stageCounts.num': e['Stage IDs'].length,
      properties: e['Properties']
    }).upsert();

  },

  SparkListenerJobEnd: function(e) {
    var app = getApp(e);
    var job = app.getJob(e);

    job.set({
      'time.end': e['Completion Time'],
      result: e['Job Result'],
      succeeded: e['Job Result']['Result'] == 'JobSucceeded',
      ended: true
    }).upsert();

    job.get('stageIDs').map(function(sid) {
      var stage = app.getStage(sid);
      var status = stage.get('status');
      if (status == RUNNING || status == FAILED) {
        l.err("Found unexpected status " + status + " for stage " + stage.id + " when marking job " + job.id + " complete.");
      } else if (!status) {
        stage.set('status', SKIPPED).upsert();
      }
    });
  },

  SparkListenerStageSubmitted: function(e) {
    var app = getApp(e);
    var si = e['Stage Info'];

    var stage = app.getStage(si);
    var attempt = stage.getAttempt(si);
    var prevStatus = attempt.get('status');
    if (prevStatus) {
      l.err(
            "Stage " + id + " marking attempt " + attempt.id + " as RUNNING despite extant status " + prevStatus
      );
    }

    // Crashes if extant status found.
    attempt.fromStageInfo(si).set({ started: true, status: RUNNING }).upsert();

    app.getJobByStageId(stage.id).inc('stageCounts.running', 1).upsert();

    stage.fromStageInfo(si).set({ properties: e['Properties'] }).inc('attempts.num', 1).inc('attempts.running', 1).upsert();
  },

  SparkListenerStageCompleted: function(e) {
    var app = getApp(e);
    var si = e['Stage Info'];

    var stage = app.getStage(si);
    stage.fromStageInfo(si);
    var prevStageStatus = stage.get('status');

    var attempt = stage.getAttempt(si);

    var prevAttemptStatus = attempt.get('status');
    var newAttemptStatus = si['Failure Reason'] ? FAILED : SUCCEEDED;

    attempt.fromStageInfo(si).set({ ended: true }).set('status', newAttemptStatus, true).upsert();

    var job = app.getJobByStageId(stage.id);

    if (prevAttemptStatus == RUNNING) {
      stage.dec('attempts.running', 1);
      l.info("before dec: " + job.get('stageCounts.running'));
      job.dec('stageCounts.running', 1);
      l.info("after dec: " + job.get('stageCounts.running'));
    } else {
      l.err(
            "Got status " + newAttemptStatus + " for stage " + stage.id + " attempt " + attempt.id + " with existing status " + prevAttemptStatus
      );
    }
    if (newAttemptStatus == SUCCEEDED) {
      if (prevStageStatus == SUCCEEDED) {
        l.info("Ignoring attempt " + attempt.id + " SUCCEEDED in stage " + stage.id + " that is already SUCCEEDED");
      } else {
        stage.set('status', newAttemptStatus).inc('attempts.succeeded', 1);
        job.inc('stageCounts.succeeded', 1);
      }
    } else {
      // FAILED
      if (prevStageStatus == SUCCEEDED) {
        l.info("Ignoring attempt " + attempt.id + " FAILED in stage " + stage.id + " that is already SUCCEEDED");
      } else {
        stage.set('status', newAttemptStatus).inc('attempts.failed', 1);
        job.inc('stageCounts.failed', 1);
      }
    }

    stage.upsert();
    attempt.upsert();
    job.upsert();

  },

  SparkListenerTaskStart: function(e) {

  },
  SparkListenerTaskGettingResult: function(e) {

  },
  SparkListenerTaskEnd: function(e) {

  },

  SparkListenerEnvironmentUpdate: function(e) {

  },
  SparkListenerBlockManagerAdded: function(e) {

  },
  SparkListenerBlockManagerRemoved: function(e) {

  },
  SparkListenerUnpersistRDD: function(e) {

  },
  SparkListenerExecutorAdded: function(e) {

  },
  SparkListenerExecutorRemoved: function(e) {

  },
  SparkListenerLogStart: function(e) {

  },
  SparkListenerExecutorMetricsUpdate: function(e) {

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
      l.info('Got data: ' + d);
      handlers[e['Event']](e)
    }
    response.end('OK');
  });
}

const SPARK_LISTENER_PORT=8123;

colls.init(url, function(db) {
  var server = http.createServer(handleRequest);

  server.listen(SPARK_LISTENER_PORT, function() {
    //Callback triggered when server is successfully listening. Hurray!
    l.info("Server listening on: http://localhost:%s", SPARK_LISTENER_PORT);
  });
});
