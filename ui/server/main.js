
TaskAttempts = new Mongo.Collection("task_attempts");

console.log("Starting server with Mongo URL: " + process.env.MONGO_URL);

Meteor.startup(function() {
  collectionsAndIndices = [
    [ Applications, { id: 1 } ],
    [ Jobs, { appId: 1, id: 1 } ],
    [ Stages, { appId: 1, id: 1 } ],
    [ Stages, { appId: 1, jobId: 1 } ],
    [ StageAttempts, { appId: 1, stageId: 1, id: 1 } ],
    [ RDDs, { appId: 1, id: 1 } ],
    [ Executors, { appId: 1, id: 1 } ],
    [ Tasks, { appId: 1, stageId: 1, id: 1 } ],
    [ TaskAttempts, { appId: 1, stageId: 1, stageAttemptId: 1, id: 1 } ],
    [ Environment, { appId: 1 } ]
  ];

  collectionsAndIndices.forEach(function(collectionAndIndex) {
    var collection = collectionAndIndex[0];
    var fields = collectionAndIndex[1];
    collection._ensureIndex(fields);
  });
});


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



function identity(x) { return x; }
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



function isEmptyObject(o) {
  for (k in o) return false;
  return true;
}

function numCmp(a,b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function SummaryMetric(label, key, render) {
  if (typeof label == 'object') {
    var obj = label;
    this.label = obj.label;
    this.key = obj.key;
    this.render = obj.render;
  } else {
    this.label = label;
    this.key = key;
    this.render = render;
  }

  this._id = new Mongo.ObjectID();
  this.fn = acc(this.key);
  this.values = [];
  this.stats = {};

  function stats(n) {
    return [
      ['min', 0],
      ['tf', parseInt(n/4)],
      ['median', parseInt(n/2)],
      ['sf', parseInt(3*n/4)],
      ['max', n - 1]
    ];
  }

  this.process = function(value, handle, initializing) {
    this.values.push(value);
    for (var i = this.values.length - 2; i >= 0 && value < this.values[i]; i--) {
      var t = this.values[i];
      this.values[i] = this.values[i + 1];
      this.values[i + 1] = t;
    }
    var changed = {};
    stats(this.values.length).forEach(function(o) {
      if (this.stats[o[0]] != this.values[o[1]]) {
        changed[o[0]] = this.values[o[1]];
        this.stats[o[0]] = this.values[o[1]];
      }
    }.bind(this));
    if (!isEmptyObject(changed) && !initializing) {
      handle.changed("summary-metrics", this._id, { stats: changed });
    }
  };
}

function SummaryMetricsTrie(metrics) {
  this.trie = {};

  metrics.forEach(function(metric) {
    var segments = metric.key.split('.');
    segments.reduce(function(obj, segment, idx) {
      if (idx + 1 == segments.length) {
        if (segment in obj) {
          throw new Error("Attempting to write non-leaf segment " + segment + " at " + idx + " in " + segments);
        }
        obj[segment] = metric;
      } else if (!(segment in obj)) {
        obj[segment] = {};
      }
      return obj[segment];
    }, this.trie);
  }.bind(this));

  this.walk = function(task, handle, initializing) {
    this._walk(this.trie, task, handle, initializing);
  };
  this._walk = function(trie, task, handle, initializing) {
    if (typeof task != 'object') {
      trie.process(task, handle, initializing);
      return;
    }
    for (k in task) {
      if (k in trie) {
        this._walk(trie[k], task[k], handle, initializing);
      }
    }
  };
}

var statRows = [
  { label: 'Task Deserialization Time', key: 'metrics.ExecutorDeserializeTime', render: 'time' },
  //{ label: 'Duration', key: duration, render: 'time' },
  { label: 'Run Time', key: 'metrics.ExecutorRunTime', render: 'time' },
  { label: 'GC Time', key: 'metrics.JVMGCTime', render: 'time' },
  { label: 'Getting Result Time', key: 'GettingResultTime', render: 'time' },
  { label: 'Result Serialization Time', key: 'metrics.ResultSerializationTime', render: 'time' },
  { label: 'Input Bytes', key: 'metrics.InputMetrics.BytesRead', render: 'bytes' },
  { label: 'Input Records', key: 'metrics.InputMetrics.RecordsRead', render: 'num' },
  { label: 'Output Bytes', key: 'metrics.OutputMetrics.BytesWritten', render: 'bytes' },
  { label: 'Output Records', key: 'metrics.OutputMetrics.RecordsWritten', render: 'num' },
  { label: 'Shuffle Read Bytes', key: 'metrics.ShuffleReadMetrics.TotalBytesRead', render: 'bytes' },
  { label: 'Shuffle Read Records', key: 'metrics.ShuffleReadMetrics.TotalRecordsRead', render: 'num' },
  { label: 'Shuffle Write Bytes', key: 'metrics.ShuffleWriteMetrics.ShuffleBytesWritten', render: 'bytes' },
  { label: 'Shuffle Write Records', key: 'metrics.ShuffleWriteMetrics.ShuffleRecordsWritten', render: 'num' }
];

Meteor.publish("stage-summary-metrics", function(appId, stageId, attemptId) {
  var apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  var app = apps.fetch()[0];
  appId = (appId == 'latest' && app) ? app.id : appId;

  var taskById = {};
  var numTasks = 0;
  var initializing = true;

  var metrics =
        statRows.map(function(stat) {
          return new SummaryMetric(stat);
        });

  var summaryMetricsTrie = new SummaryMetricsTrie(metrics);

  console.log("stage-summary-metrics: adding tasks");
  var self = this;
  var handle = TaskAttempts.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId }).observeChanges({
    added: function(_id, task) {
      numTasks++;
      taskById[_id] = task;
      summaryMetricsTrie.walk(task, self, initializing);
    },
    changed: function(_id, fields) {
      if (!(_id in taskById)) {
        throw new Error("Task with _id " + _id + " not found. Fields: ", fields);
      }
      var task = taskById[_id];
      summaryMetricsTrie.walk(fields, self, initializing);
    }
  });
  console.log(
        "stage-summary-metrics: ready.. %s",
        JSON.stringify(metrics.map(function(s) { return { label: s.label, stats: s.stats }; }))
  );
  initializing = false;
  metrics.forEach(function (metric) {
    this.added("summary-metrics", metric._id, { label: metric.label, stats: metric.stats, render: metric.render });
  }.bind(this));
  this.ready();

  self.onStop(function () {
    handle.stop();
  });
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
