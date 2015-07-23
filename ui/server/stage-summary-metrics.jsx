
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

  this.process = function(newValue, prevValue, handle, initializing) {
    var idx = -1;
    var dir = -1;
    if (prevValue === undefined) {
      this.values.push(newValue);
      idx = this.values.length - 1;
    } else {
      idx = this.values.lastIndexOf(prevValue);
      if (idx < 0) {
        console.error("Metrics %s didn't find previous value %s:\n%s", this.label, prevValue, this.values.join(','));
        // Most graceful way to handle this is just insert a new record; stats won't be exactly correct anymore but they
        // can't be at this point, something has gone wrong and an ERROR has been logged.
        this.values.push(newValue);
        idx = this.values.length;
      } else {
        if (newValue >= prevValue) {
          dir = 1;
        }
        this.values[idx] = newValue;
      }
    }
    for (
          var i = idx + dir;
          0 <= i &&
          i < this.values.length &&
          (
                (dir > 0) ?
                      (newValue > this.values[i]) :
                      (newValue < this.values[i])
          );
          i += dir
    ) {
      var t = this.values[idx];
      this.values[idx] = this.values[i];
      this.values[i] = t;
      idx = i;
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

  this.walk = function(newFields, prevTask, handle, initializing) {
    return this._walk(this.trie, newFields, prevTask, handle, initializing);
  };
  this._walk = function(trie, newFields, prevTask, handle, initializing) {
    if (typeof newFields != 'object') {
      trie.process(newFields, prevTask, handle, initializing);
      return newFields;
    }
    prevTask = prevTask || {};
    for (k in newFields) {
      if (k in trie) {
        prevTask[k] = this._walk(trie[k], newFields[k], prevTask[k], handle, initializing);
      }
    }
    return prevTask;
  };
}

var statRows = [
  { label: 'Duration', key: 'duration', render: 'time' },
  { label: 'Run Time', key: 'metrics.ExecutorRunTime', render: 'time' },
  { label: 'Task Deserialization Time', key: 'metrics.ExecutorDeserializeTime', render: 'time' },
  { label: 'Getting Result Time', key: 'metrics.GettingResultTime', render: 'time' },
  { label: 'Scheduler Delay Time', key: 'metrics.SchedulerDelayTime', render: 'time' },
  { label: 'Result Serialization Time', key: 'metrics.ResultSerializationTime', render: 'time' },
  { label: 'GC Time', key: 'metrics.JVMGCTime', render: 'time' },
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
  var start = moment();
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
      var addStart = moment();
      taskById[_id] = task;
      summaryMetricsTrie.walk(task, undefined, self, initializing);
    },
    changed: function(_id, fields) {
      if (!(_id in taskById)) {
        throw new Error("Task with _id " + _id + " not found. Fields: ", fields);
      }
      var task = taskById[_id];
      taskById[_id] = summaryMetricsTrie.walk(fields, task, self, initializing);

    }
  });
  initializing = false;
  metrics.forEach(function (metric) {
    this.added("summary-metrics", metric._id, { label: metric.label, stats: metric.stats, render: metric.render });
  }.bind(this));
  this.ready();
  var after = moment();
  console.log("stage-summary-metrics finished in %d ms", after - start);

  self.onStop(function () {
    handle.stop();
  });
});


