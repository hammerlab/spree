var http = require('http');
var assert = require('assert');

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/spruit';

const SPARK_LISTENER_PORT=8123;

var activeAppId = null;

var Applications = null;

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

  },
  "SparkListenerJobEnd": function(e) {

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
    activeAppId = o.id;
    Applications.findOneAndUpdate(
          { id: e['App ID'] },
          { $set: o },
          { upsert: true, new: true },
          function(err, app) {
            if (err) {
              console.error("Error adding application start: ", err);
            } else {
              console.log("Added application start: %O", app);
            }
          }
    );
  },
  "SparkListenerApplicationEnd": function(e) {
    Applications.findOneAndUpdate(
          { id: activeAppId },
          { time: { end: e['Timestamp'] } },
          { upsert: true, new: true },
          function(err, app) {
            if (err) {
              console.error("Error adding application end: %O", err);
            } else {
              console.log("Added application end: %O", app);
            }
          }
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

  var server = http.createServer(handleRequest);

  server.listen(SPARK_LISTENER_PORT, function() {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", SPARK_LISTENER_PORT);
  });

  //db.close();
});
