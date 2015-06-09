//Lets require/import the HTTP module
var http = Npm.require('http');

//Lets define a port we want to listen to
const PORT=8123;

var activeAppId = null;

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
      id: e['App ID'],
      name: e['App Name'],
      time: { $set: { start: e['Timestamp'] } },
      user: e['User']
    }
    if (e['App Attempt ID']) {
      o.attempt = e['App Attempt ID'];
    }
    activeAppId = o.id;
    Applications.upsert(o);
  },
  "SparkListenerApplicationEnd": function(e) {
    Applications.upsert({
      id: activeAppId,
      time: { $set: { end: e['Timestamp'] } }
    });
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

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
  //Callback triggered when server is successfully listening. Hurray!
  console.log("Server listening on: http://localhost:%s", PORT);
});
