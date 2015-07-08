
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
        changed['stats.' + o[0]] = this.values[o[1]];
        this.stats[o[0]] = this.values[o[1]];
      }
    }.bind(this));
    if (!isEmptyObject(changed) && !initializing) {
      handle.changed("summary-metrics", this._id, changed);
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

var moment = Meteor.npmRequire('moment');
Meteor.publish("stage-summary-metrics", function(appId, stageId, attemptId) {
  var before = moment();
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
  initializing = false;
  metrics.forEach(function (metric) {
    this.added("summary-metrics", metric._id, { label: metric.label, stats: metric.stats, render: metric.render });
  }.bind(this));
  this.ready();
  var after = moment();
  console.log("stage-summary-metrics finished in %d ms", after - before);

  self.onStop(function () {
    handle.stop();
  });
});


