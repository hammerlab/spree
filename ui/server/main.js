
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
Meteor.publish("apps", function(opts) {
  opts = opts || {};
  return Applications.find({}, opts);
});

Meteor.publish("app", function(appId) {
  var apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  var app = apps.fetch()[0];
  var appId = (appId == 'latest' && app) ? app.id : appId;
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
    Environment.find({ appId: appId })
  ];
});


// Job page
Meteor.publish("job-page", function(appId, jobId) {
  var apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  var appId = (appId == 'latest') ? apps.fetch()[0].id : appId;

  return [
    apps,
    Jobs.find({appId: appId, id: jobId})
  ];
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


// StageAttempt page
Meteor.publish("stage-page", function(appId, stageId, attemptId) {
  var apps = (appId == 'latest') ? lastApp() : Applications.find({ id: appId });
  var app = apps.fetch()[0];
  appId = (appId == 'latest' && app) ? app.id : appId;

  return [
    apps,
    StageAttempts.find({ appId: appId, stageId: stageId, id: attemptId })
  ];
});

function publishCountsByStatus(collection, objType) {
  var name = objType + "-counts";
  Meteor.publish(name, function(findObj) {
    var self = this;
    var initializing = true;
    var id = new Mongo.ObjectID();
    var stages = {};
    var counts = {};
    var handle = collection.find(findObj, { fields: { status: 1 }}).observeChanges({
      added: function(_id, stage) {
        var status = stage.status;
        var statusStr = lstatuses[status];
        stages[_id] = statusStr;

        if (!(statusStr in counts)) {
          counts[statusStr] = 0;
        }
        counts[statusStr]++;

        if (!('all' in counts)) {
          counts.all = 0;
        }
        counts.all++;

        if (!initializing) {
          var changedObj = { all: counts.all };
          changedObj[statusStr] = counts[statusStr];
          self.changed(name, id, changedObj);
        }
      },
      changed: function(_id, fields) {
        var prevStatusStr = stages[_id];
        var newStatus = fields.status;
        var statusStr = lstatuses[newStatus];
        stages[_id] = statusStr;
        var changedObj = {};
        counts[prevStatusStr]--;
        if (!(statusStr in counts)) {
          counts[statusStr] = 0;
        }
        counts[statusStr]++;
        changedObj[prevStatusStr] = counts[prevStatusStr];
        changedObj[statusStr] = counts[statusStr];
        self.changed(name, id, changedObj);
      }
    });

    initializing = false;
    this.added(name, id, counts);
    this.ready();

    this.onStop(function() {
      handle.stop();
    });
  });
}

publishCountsByStatus(StageAttempts, "stage");
publishCountsByStatus(Jobs, "job");
publishCountsByStatus(Executors, "executor");

function publishObjsByStatus(collection, objType, selectors) {
  selectors.forEach(function(arr) {
    var name = arr[0] + "-" + objType;
    var statusObj = arr[1];
    Meteor.publish(name, function(additionalFindObj, opts) {
      var findObj = extend({}, statusObj, additionalFindObj);
      console.log("publish %s:", name, JSON.stringify(findObj));
      var self = this;
      var handle = collection.find(findObj, opts).observeChanges({
        added: function(_id, stage) {
          self.added(name, _id, stage);
        },
        changed: function(_id, fields) {
          self.changed(name, _id, fields);
        },
        removed: function(_id) {
          self.removed(name, _id);
        }
      });

      this.ready();

      this.onStop(function() {
        handle.stop();
      });
    });
  });
}

publishObjsByStatus(
      StageAttempts,
      "stages",
      [
        [ "all", {} ],
        [ "succeeded", { status: SUCCEEDED } ],
        [ "failed", { status: FAILED } ],
        [ "running", { status: RUNNING } ],
        [ "pending", { status: { $exists: false } } ],
        [ "skipped", { status: SKIPPED } ]
      ]
);

publishObjsByStatus(
      Jobs,
      "jobs",
      [
        [ "all", {} ],
        [ "succeeded", { status: SUCCEEDED } ],
        [ "failed", { status: FAILED } ],
        [ "running", { status: RUNNING } ]
      ]
);

publishObjsByStatus(
      Executors,
      "executors",
      [
        [ "all", {} ],
        [ "running", { status: RUNNING } ],
        [ "removed", { status: REMOVED } ]
      ]
);

Meteor.publish("stage-attempts", function(appId, opts) {
  return StageAttempts.find({ appId: appId }, opts);
});

Meteor.publish("stage-tasks", function(appId, stageId, attemptId, opts) {
  return TaskAttempts.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId }, opts);
});

Meteor.publish("stage-executors", function(appId, stageId, attemptId, opts) {
  return StageExecutors.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId }, opts);
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

  return [
    apps,
    RDDs.find({ appId: appId, id: rddId })
  ];
});

Meteor.publish("rdd-executors", function(appId, rddId, opts) {
  return RDDExecutors.find({ appId: appId, rddId: rddId, status: { $ne: REMOVED } }, opts);
});

Meteor.publish("rdd-blocks", function(appId, rddId, opts) {
  return RDDBlocks.find({ appId: appId, rddId: rddId }, opts);
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

Meteor.publish("executors", function(appId, opts) {
  return Executors.find({ appId: appId }, opts);
});

Meteor.publish("rdds", function(appId, opts) {
  return RDDs.find(
        {
          appId: appId,
          $or: [
            { "StorageLevel.UseDisk": true },
            { "StorageLevel.UseMemory": true },
            { "StorageLevel.UseExternalBlockStore": true },
            { "StorageLevel.Deserialized": true },
            { "StorageLevel.Replication": { $ne: 1} }
          ],
          unpersisted: { $ne: true }
        },
        opts
  );
});

function publishNum(collectionName, collection, findFields) {
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
                findFields.apply(this, extraArgs) :
                findFields
    );
    var handle = collection.find(findObj, { fields: {} }).observeChanges({
      added: function (_id, o) {
        count++;
        if (!initializing && appObjId) {
          self.changed(collectionName, appObjId, { count: count });
        }
      },
      removed: function (_id) {
        count--;
        if (!initializing && appObjId) {
          self.changed(collectionName, appObjId, { count: count });
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
  [
    'num-stage-executors',
    StageExecutors,
    function(stageId, stageAttemptId) {
      return (stageId !== undefined) ? { stageId: stageId, stageAttemptId: stageAttemptId } : {};
    }
  ],
  [
    'num-rdd-executors',
    RDDExecutors,
    function(rddId) {
      return (rddId !== undefined) ? { rddId: rddId, status: { $ne: REMOVED } } : {};
    }
  ],
  [
    'num-rdd-blocks',
    RDDBlocks,
    function(rddId) {
      return (rddId !== undefined) ? { rddId: rddId } : {};
    }
  ]
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
    added: function (id, a) {
      count++;
      if (!initializing) {
        self.changed("num-applications", _id, { count: count });
      }
    },
    changed: function (id, e) {
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
