
TaskAttempts = new Mongo.Collection("task_attempts");

console.log("Starting server with Mongo URL: " + process.env.MONGO_URL);

function parseMongoUrl(url) {
  var m = url.match("^mongodb://([^:]+):([0-9]+)/(.*)$");
  if (!m) return {};
  return {
    host: m[1],
    port: parseInt(m[2]),
    db: m[3],
    url: url,
    shortUrl: url.substr("mongodb://".length)
  };
}

Meteor.publish('mongoUrl', function () {
  this.added('mongoUrl', '1', parseMongoUrl(process.env.MONGO_URL));
  this.ready();
});

// Test page
Meteor.publish("test-page", function() {
  return Test.find();
});

// Apps page
Meteor.publish("apps", function() {
  return Applications.find();
});

Meteor.publish("app", function(appId) {
  return Applications.find({ id: appId });
});

Meteor.publish("latest-app", function() {
  return Applications.find({}, { sort: { _id: -1 }, limit: 1 });
});

lastApp = function() {
  return Applications.find({ id: { $exists: true } }, { sort: { _id: -1 }, limit: 1 });
};

// Jobs page
Meteor.publish("jobs-page", function(appId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  var app = apps.fetch()[0];
  appId = (appId == 'latest' && app) ? app.id : appId;
  return [
    apps,
    Environment.find({ appId: appId }),
    Jobs.find({appId: appId }),
    Stages.find({ appId: appId })
  ];
});


// Job page
Meteor.publish("job-page", function(appId, jobId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;

  var stages = Stages.find({ appId: appId, jobId: jobId }, { sort: { id: -1 }});
  var stageIDs = stages.map(function(stage) { return stage.id; });

  return [
    apps,
    Jobs.find({appId: appId, id: jobId}),
    stages,
    StageAttempts.find({ appId: appId, stageId: { $in: stageIDs }})
  ];
});


// Stages page
Meteor.publish("stages-page", function(appId) {
  var apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  var app = apps.fetch()[0];
  var appId = (appId == 'latest' && app) ? app.id : appId;
  return [
    apps,
    Stages.find({ appId: appId }),
    StageAttempts.find({ appId: appId })
  ]
});


shuffleBytesRead = function(shuffleReadMetrics) {
  if (!shuffleReadMetrics) return 0;
  if ('metrics' in shuffleReadMetrics) shuffleReadMetrics = shuffleReadMetrics['metrics'];
  if ('ShuffleReadMetrics' in shuffleReadMetrics) shuffleReadMetrics = shuffleReadMetrics['ShuffleReadMetrics'];
  return shuffleReadMetrics && (shuffleReadMetrics.LocalBytesRead + shuffleReadMetrics.RemoteBytesRead) || 0;
};
duration = function(x) { return x && x.time && (x.time.end - x.time.start) || 0; };
acc = function(key) {
  if (!key) {
    return identity;
  }
  if (typeof key == 'string') {
    return acc(key.split('.'));
  }
  return key.reduce(function(soFar, next) {
    return function(x) {
      var sf = soFar(x);
      return sf ? sf[next] : undefined;
    };
  }, function(x) { return x; });
};

var statRows = [
  ['Task Deserialization Time', 'metrics.ExecutorDeserializeTime', 'time'],
  ['Duration', duration, 'time'],
  ['GC Time', 'metrics.JVMGCTime', 'time'],
  ['Getting Result Time', 'GettingResultTime', 'time'],
  ['Result Serialization Time', 'ResultSerializationTime', 'time'],
  ['Input Bytes', 'metrics.InputMetrics.BytesRead', 'bytes'],
  ['Input Records', 'metrics.InputMetrics.RecordsRead', 'num'],
  ['Output Bytes', 'metrics.OutputMetrics.BytesWritten', 'bytes'],
  ['Output Records', 'metrics.OutputMetrics.RecordsWritten', 'num'],
  ['Shuffle Read Bytes', shuffleBytesRead, 'bytes'],
  ['Shuffle Read Records', 'metrics.ShuffleReadMetrics.TotalRecordsRead', 'num'],
  ['Shuffle Write Bytes', 'metrics.ShuffleWriteMetrics.ShuffleBytesWritten', 'bytes'],
  ['Shuffle Write Records', 'metrics.ShuffleWriteMetrics.ShuffleRecordsWritten', 'num']
].map(function(x) {
        if (typeof x[1] == 'string')
          return [x[0], acc(x[1]), x[2]];
        return x;
      });

//Meteor.publish("stage-execs", function(appId, stageId, attemptId) {
//  console.log("stage-execs (%s,%d,%d) initing", appId, stageId, attemptId);
//  //var initializing = true;
//  var self = this;
//  var numAdded = 0;
//
//  var stageKey = ['stages', stageId, attemptId].join('.');
//  var stageKeyFn = acc(stageKey);
//
//  var fieldsObj = { id: 1, host: 1, port: 1 };
//  fieldsObj[stageKey] = 1;
//
//  var handle = Executors.find({ appId: appId }, { fields: fieldsObj }).observeChanges({
//    added: function(_id, e) {
//      numAdded++;
//      var stageExec = stageKeyFn(e);
//      if (stageExec) {
//        for (var k in stageExec) {
//          e[k] = stageExec[k];
//        }
//        delete e['stages'];
//        self.added('stage-execs', _id, e);
//      }
//    },
//    changed: function(_id, e) {
//      console.log("changed: ", _id, e);
//      var stageExec = stageKeyFn(e);
//      if (stageExec) {
//        for (var k in stageExec) {
//          e[k] = stageExec[k];
//        }
//        delete e['stages'];
//        self.changed('stage-execs', _id, e);
//      }
//    },
//    removed: function(_id) {
//      console.log("removed: ", _id);
//      self.removed('stage-execs', _id);
//    }
//  });
//
//  initializing = false;
//  this.ready();
//  console.log("stage-execs (%s,%d,%d) ready, %d records", appId, stageId, attemptId, numAdded);
//
//  this.onStop(function() {
//    handle.stop();
//  });
//});

//Meteor.publish("tasks-with-execs", function(appId, stageId, attemptId) {
//  console.log("tasks-with-execs (%s,%d,%d) initing", appId, stageId, attemptId);
//  var initializing = true;
//  var self = this;
//  var eById = {};
//
//  var execHandle = Executors.find({ appId: appId }, { fields: { id: 1, host: 1, port: 1 } }).observeChanges({
//    added: function(_id, e) {
//      console.log("adding executor %s: ", e.id, e);
//      eById[e.id] = e;
//    }
//  });
//
//  var numAdded = 0;
//
//  var handle = TaskAttempts.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId }).observe({
//    added: function(t) {
//      numAdded++;
//      var e = eById[t.execId];
//      t.host = e.host;
//      t.port = e.port;
//      t.duration = t.time && (t.time.end - t.time.start) || 0;
//      if (t.metrics && t.metrics.ShuffleReadMetrics) {
//        t.metrics.ShuffleReadMetrics.TotalBytesRead =
//              t.metrics.ShuffleReadMetrics.LocalBytesRead + t.metrics.ShuffleReadMetrics.RemoteBytesRead;
//      }
//      self.added('etasks', t._id, t);
//    },
//    changed: function(t, oldT) {
//      //console.log("changed: ", _id, fields);
//      t.duration = t.time && (t.time.end - t.time.start) || 0;
//      if (t.metrics && t.metrics.ShuffleReadMetrics) {
//        t.metrics.ShuffleReadMetrics.TotalBytesRead =
//              t.metrics.ShuffleReadMetrics.LocalBytesRead + t.metrics.ShuffleReadMetrics.RemoteBytesRead;
//      }
//      self.changed('etasks', t._id, t);
//    },
//    removed: function(t) {
//      //console.log("removed: ", _id);
//      self.removed('etasks', t._id);
//    }
//  });
//
//  initializing = false;
//  this.ready();
//  console.log("tasks-with-execs (%s,%d,%d) ready, %d records", appId, stageId, attemptId, numAdded);
//
//  this.onStop(function() {
//    execHandle.stop();
//    handle.stop();
//  });
//});

// StageAttempt page
Meteor.publish("stage-page", function(appId, stageId, attemptId) {
  var apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  var app = apps.fetch()[0];
  appId = (appId == 'latest' && app) ? app.id : appId;

  var executorStageKey = ["stages", stageId, attemptId].join('.');
  var fieldsObj = { id: 1, host: 1, port: 1 };
  fieldsObj[executorStageKey] = 1;
  var executors = Executors.find({ appId: appId }, { fields: fieldsObj });

  return [
    apps,
    Stages.find({ appId: appId, id: stageId }),
    StageAttempts.find({ appId: appId, stageId: stageId, id: attemptId }),
    //Tasks.find({ appId: appId, stageId: stageId }),
    TaskAttempts.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId }),
    executors
  ];
});


// Storage page
Meteor.publish("rdds-page", function(appId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  var rdds = RDDs.find({
    appId: appId,
    $or: [
      { "StorageLevel.UseDisk": true },
      { "StorageLevel.UseMemory": true },
      { "StorageLevel.UseExternalBlockStore": true },
      { "StorageLevel.Deserialized": true },
      { "StorageLevel.Replication": { $ne: 1} }
    ],
    unpersisted: { $ne: true }
  });
  return [
    apps,
    rdds
  ];
});

Meteor.publish("rdd-page", function(appId, rddId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  var rddKey = ['blocks', 'rdd', rddId].join('.');
  var queryObj = { appId: appId };
  queryObj[rddKey] = { $exists: true };

  var fieldsObj = { host: 1, port: 1, id: 1, maxMem: 1 };
  fieldsObj[rddKey] = 1;

  return [
    apps,
    RDDs.find({ appId: appId, id: rddId }),
    Executors.find(queryObj, { fields: fieldsObj })
  ];
});

// Environment Page
Meteor.publish("environment-page", function(appId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  return [
    apps,
    Environment.find({ appId: appId })
  ];
});

// Executors Page
Meteor.publish('executors-page', function(appId) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  return [
    apps,
    Executors.find({ appId: appId })
  ];
});
