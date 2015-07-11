
extend = Meteor.npmRequire("extend");

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
Meteor.publish("stage-page", function(appId, stageId, attemptId, pageOpts) {
  var apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  var app = apps.fetch()[0];
  appId = (appId == 'latest' && app) ? app.id : appId;

  var executorStageKey = ["stages", stageId, attemptId].join('.');
  var fieldsObj = { id: 1, host: 1, port: 1 };
  fieldsObj[executorStageKey] = 1;
  var executors = Executors.find({ appId: appId }, { fields: fieldsObj });

  pageOpts = pageOpts || {};
  pageOpts.limit = pageOpts.limit || 100;
  pageOpts.sort = pageOpts.sort || { _id: 1 };

  return [
    apps,
    Stages.find({ appId: appId, id: stageId }),
    StageAttempts.find({ appId: appId, stageId: stageId, id: attemptId }),
    //Tasks.find({ appId: appId, stageId: stageId }),
    TaskAttempts.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId }, pageOpts),
    executors
  ];
});



// Storage page
Meteor.publish("rdds-page", function(appId, opts) {
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
  }, opts || {});
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
    Executors.find(queryObj, { fields: fieldsObj }),
    RDDBlocks.find({ appId: appId, rddId: rddId })
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
Meteor.publish('executors-page', function(appId, opts) {
  apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  appId = (appId == 'latest') ? apps.fetch()[0].id : appId;
  if (opts.limit === undefined) {
    opts.limit = 100;
  }
  return [
    apps,
    Executors.find({ appId: appId }, opts || {})
  ];
});

function publishNum(collectionName, collection, findFields, endedFn) {
  findFields = findFields || {};

  Meteor.publish(collectionName, function(appId) {
    var initializing = true;
    var self = this;
    var count = 0;

    var appObjId = null;
    var appHandle = Applications.find({ id: appId }, { fields: {} }).observeChanges({
      added: function(_id, a) {
        appObjId = _id;
        if (!initializing) {
          self.added(collectionName, appObjId, { count: count });
        }
      }
    });

    var extraArgs = Array.prototype.slice.call(arguments, 1);
    var findObj = extend(
          { appId: appId },
          (typeof findFields === 'function') ?
                findFields.call(this, extraArgs) :
                findFields
    );
    var handle = collection.find(findObj, { fields: {} }).observeChanges({
      added: function (_id, o) {
        count++;
        if (!initializing && appObjId) {
          self.changed(collectionName, appObjId, { count: count });
        }
      },
      changed: function (_id, o) {
        if (!endedFn || endedFn(o)) {
          count--;
          if (!initializing && appObjId) {
            self.changed(collectionName, appObjId, { count: count });
          }
        }
      }
    });

    initializing = false;
    if (appObjId) {
      this.added(collectionName, appObjId, { count: count });
    }
    this.ready();

    this.onStop(function() {
      appHandle.stop();
      handle.stop();
    });
  });
}

[
  [ 'num-executors', Executors ],
  [
    'num-rdds',
    RDDs,
    {
      $or: [
        { "StorageLevel.UseDisk": true },
        { "StorageLevel.UseMemory": true },
        { "StorageLevel.UseExternalBlockStore": true },
        { "StorageLevel.Deserialized": true },
        { "StorageLevel.Replication": { $ne: 1} }
      ],
      unpersisted: { $ne: true }
    }
  ],
  [ 'num-jobs', Jobs ],
  [ 'num-stage-attempts', StageAttempts, function(jobId) { return { jobId: jobId }; } ]
].forEach(
      function(arr) {
        publishNum.apply(this, arr);
      }
);

Meteor.publish("num-applications", function() {
  var initializing = true;
  var self = this;
  var count = 0;

  var _id = new Mongo.ObjectID();

  var handle = Applications.find({}, { fields: {} }).observeChanges({
    added: function (_id, a) {
      count++;
      if (!initializing) {
        self.changed("num-applications", _id, { count: count });
      }
    },
    changed: function (_id, e) {
      if ('unpersisted' in e) {
        count--;
        if (!initializing) {
          self.changed("num-applications", _id, { count: count });
        }
      }
    }
  });

  initializing = false;
  this.added("num-applications", _id, { count: count });
  this.ready();

  this.onStop(function() {
    handle.stop();
  });
});
