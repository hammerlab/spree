
function isEmptyObject(o) {
  for (k in o) return false;
  return true;
}

function numCmp(a,b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function makeStatsArr(n) {
  return [
    ['min', 0],
    ['tf', parseInt(n/4)],
    ['median', parseInt(n/2)],
    ['sf', parseInt(3*n/4)],
    ['max', Math.max(0, n - 1)]
  ];
}

function SummaryMetric(label, key, render, handle) {
  this.usesHist = false;

  if (typeof label == 'object') {
    var obj = label;
    this.label = obj.label;
    this.key = obj.key;
    this.render = obj.render;
    this.handle = key;
  } else {
    this.label = label;
    this.key = key;
    this.render = render;
    this.handle = handle;
  }
  this._id = new Mongo.ObjectID();
  this.fn = acc(this.key);
  this.stats = {};

  this.initializing = true;

  if (this.usesHist) {
    this.uniqueValues = [];
    this.uniqueValuesMap = {};
    this.hist = [];
    this.n = 0;
  } else {
    this.values = [];

    this.tree = new OST();
    this.n = 0;
  }

  this.initialize = function() {
    this.initializing = false;
    if (this.usesHist) {
      this.uniqueValues.sort(function(a,b) { return a-b; }).forEach((v) => {
        this.hist.push([v, this.uniqueValuesMap[v]]);
      });
      this.uniqueValues = [];
      this.uniqueValuesMap = {};
    } else {
      //this.values.sort();
    }
    this.getChangedObj();
    //console.log("%s stats:", this.label, JSON.stringify(this.stats));
    var obj = { label: this.label, stats: this.stats, render: this.render };
    //console.log("adding:", JSON.stringify(obj), JSON.stringify(this.hist));
    this.handle.added("summary-metrics", this._id, obj);
  };

  this.findIdx = function(key, start, end) {
    start = start || 0;
    if (end === undefined) end = this.hist.length;
    if (start == end) return start;
    var mid = parseInt((start + end) / 2);
    var elem = this.hist[mid][0];
    if (elem < key) {
      return this.findIdx(key, mid + 1, end);
    } else if (elem > key) {
      return this.findIdx(key, start, mid);
    }
    return mid;
  };

  this.incValue = function(value) {
    var idx = this.findIdx(value);
    var elem = this.hist[idx];
    if (idx < this.hist.length && elem[0] == value) {
      elem[1]++;
    } else {
      this.hist.splice(idx, 0, [value, 1]);
    }
    this.n++;
  };

  this.decValue = function(value) {
    if (value === undefined) return;

    var idx = this.findIdx[value];
    var elem = this.hist[idx];
    if (elem[0] != value) {
      console.log("ERROR: Dec'ing value %d, not found in hist: %s", value, JSON.stringify(this.hist));
      return;
    } else if (!elem[1]) {
      console.log("ERROR: Dec'ing zeroed value %d in hist: %s", value, JSON.stringify(this.hist));
      this.hist.splice(idx, 1);
      return;
    }
    elem[1]--;
    this.n--;
  };

  this.updateValuesHist = function(newValue, prevValue) {
    if (this.initializing) {
      this.incValue(newValue);
      this.decValue(prevValue);
    } else {
      if (!(newValue in this.uniqueValuesMap)) {
        this.uniqueValuesMap[newValue] = 0;
        this.uniqueValues.push(newValue);
      }
      this.uniqueValuesMap[newValue]++;
    }
  };

  this.updateValuesArray = function(newValue, prevValue) {
    if (prevValue !== undefined) {
      var prevNode = this.tree.search(prevValue);
      if (!prevNode) {
        console.error("Metrics %s didn't find previous value %s:\n%s", this.label, prevValue, this.values.join(','));
        this.n++;
      } else {
        this.tree.delete(prevNode);
      }
    } else {
      this.n++;
    }

    //var prevSize = this.tree.size();
    //console.log("inserting: %s->%d", prevValue, newValue);
    if (!this.tree.insert(newValue, newValue)) {
      console.error("Failed to insert %d (%s, %s) into tree of size %d", newValue, parseInt(newValue, 10), isNaN(parseInt(newValue, 10)), this.tree.size());
    } else {
      //console.log("Inserted %d into tree. Size: %d", newValue, this.tree.size());
    }
    //console.log("inserted");
    //console.log("Inserted %s->%d. Size %d -> %d", prevValue, newValue, prevSize, this.tree.size());

    //if (this.initializing) {
    //  this.values.push(newValue);
    //  return;
    //}
    //var idx = -1;
    //var dir = -1;
    //if (prevValue === undefined) {
    //
    //  this.values.push(newValue);
    //  idx = this.values.length - 1;
    //} else {
    //  idx = this.values.lastIndexOf(prevValue);
    //  if (idx < 0) {
    //    console.error("Metrics %s didn't find previous value %s:\n%s", this.label, prevValue, this.values.join(','));
    //    // Most graceful way to handle this is just insert a new record; stats won't be exactly correct anymore but they
    //    // can't be at this point, something has gone wrong and an ERROR has been logged.
    //    this.values.push(newValue);
    //    idx = this.values.length;
    //  } else {
    //    if (newValue >= prevValue) {
    //      dir = 1;
    //    }
    //    this.values[idx] = newValue;
    //  }
    //}
    //for (
    //      var i = idx + dir;
    //      0 <= i &&
    //      i < this.values.length &&
    //      (
    //            (dir > 0) ?
    //                  (newValue > this.values[i]) :
    //                  (newValue < this.values[i])
    //      );
    //      i += dir
    //) {
    //  var t = this.values[idx];
    //  this.values[idx] = this.values[i];
    //  this.values[i] = t;
    //  idx = i;
    //}
  };

  this.getChangedObjArray = function() {
    var changed = {};

    //console.log("changed obj: tree size %d, n: %d", this.tree.size(), this.n);
    makeStatsArr(this.tree.size()).forEach(function(o) {
      var node = this.tree.select(o[1]);
      if (!node) {
        console.error("Failed to find node at idx %d", o[1]);
      } else {
        var prev = this.stats[o[0]];
        //console.log("%s: %s->%s vs %d for %s:%d, %s, %s != %s: %s", this.label, prev, this.stats[o[0]], node.value, o[0], o[1], JSON.stringify(this.stats), this.stats[o[0]], node.value, this.stats[o[0]] != node.value);
        if (this.stats[o[0]] != node.value) {
          changed['stats.' + o[0]] = node.value;
          this.stats[o[0]] = node.value;
        }
      }
    }.bind(this));

    //makeStatsArr(this.values.length).forEach(function(o) {
    //  if (this.stats[o[0]] != this.values[o[1]]) {
    //    changed['stats.' + o[0]] = this.values[o[1]];
    //    this.stats[o[0]] = this.values[o[1]];
    //  }
    //}.bind(this));

    return changed;
  };

  this.getChangedObjHist = function() {
    var changed = {};

    var statsArr = makeStatsArr(this.n);
    var curStatsIdx = 0;
    var curStat = statsArr[curStatsIdx];
    var curIdx = 0;
    this.hist.forEach((arr) => {
      curIdx += arr[1];
      while(curStatsIdx < statsArr.length && curIdx > curStat[1]) {
        if (this.stats[curStat[0]] != arr[0]) {
          changed['stats.' + curStat[0]] = arr[0];
          this.stats[curStat[0]] = arr[0];
        }
        curStatsIdx++;
        curStat = statsArr[curStatsIdx];
      }
    });

    return changed;
  };

  this.updateValues = function(newValue, prevValue) {
    if (this.usesHist) {
      this.updateValuesHist(newValue, prevValue);
    } else {
      this.updateValuesArray(newValue, prevValue);
    }
  };

  this.getChangedObj = function() {
    if (this.usesHist) {
      return this.getChangedObjHist();
    } else {
      return this.getChangedObjArray();
    }
  };

  this.process = function(newValue, prevValue) {
    this.updateValues(newValue, prevValue);
    if (!this.initializing) {
      var changed = this.getChangedObj();
      if (!isEmptyObject(changed)) {
        this.handle.changed("summary-metrics", this._id, changed);
      }
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

  this.walk = function(newFields, prevTask) {
    return this._walk(this.trie, newFields, prevTask);
  };
  this._walk = function(trie, newFields, prevTask) {
    if (typeof newFields != 'object') {
      trie.process(newFields, prevTask);
      return newFields;
    }
    prevTask = prevTask || {};
    for (k in newFields) {
      if (k in trie) {
        prevTask[k] = this._walk(trie[k], newFields[k], prevTask[k]);
      }
    }
    return prevTask;
  };
}

function SkipMetric(stat, pub, appId, stageId, attemptId) {
  var label = stat.label;
  var key = stat.key;
  var render = stat.render;

  var id = new Mongo.ObjectID();
  var fn = acc(key);
  stats = {};
  handles = [];

  var fieldsObj = {};
  fieldsObj[key] = 1;

  var sortObj = {};
  sortObj[key] = 1;


  this.initialize = function(stage) {
    var total = stage.taskCounts.num;

    pub.added("stage-summary-metrics", id, { label: label, stats: {}, render: render });
    handles = makeStatsArr(total).map((arr) => {
      var key = arr[0];
      var skip = arr[1];

      var statHandle =
            TaskAttempts.find(
                  { appId: appId, stageId: stageId, stageAttemptId: attemptId },
                  { fields: fieldsObj, sort: sortObj, skip: skip, limit: 1 }
            ).observeChanges({
              added(_id, t) {
                var val = fn(t);
                console.log("%s:%s: added %s (%d)", label, key, JSON.stringify(t), val);
                if (stats[key] != val) {
                  var changedObj = {};
                  changedObj[key] = val;
                  pub.changed("stage-summary-metrics", id, { stats: changedObj });
                }
              },
              changed(_id, fields) {
                var val = fn(t);
                console.log("%s:%s: changed %s", label, key, JSON.stringify(fields));
                if (stats[key] != val) {
                  var changedObj = {};
                  changedObj[key] = val;
                  pub.changed("stage-summary-metrics", id, { stats: changedObj });
                }
              }
            });

      return statHandle;
    });
  };

  this.stop = function() {
    handles.forEach((handle) => {
      handle.stop();
    });
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

  var self = this;

  //var skipMetrics = statRows.map((stat) => {
  //  return new SkipMetric(stat, self, appId, stageId, attemptId);
  //});
  //
  //var stageHandle =
  //      StageAttempts.find(
  //            { appId: appId, stageId: stageId, id: attemptId },
  //            { 'taskCounts.num': 1 }
  //      ).observeChanges({
  //        added(_id, stage) {
  //          console.log("got stage, %d tasks", stage.taskCounts.num);
  //          skipMetrics.forEach((skipMetric) => {
  //            skipMetric.initialize(stage);
  //          });
  //        }
  //      });
  //
  //this.ready();
  //var after = moment();
  //console.log("stage-summary-metrics finished in %d ms", after - start);
  //
  //self.onStop(function () {
  //  stageHandle.stop();
  //  skipMetrics.forEach((skipMetric) => {
  //    skipMetric.stop();
  //  });
  //});

  var taskById = {};

  var metrics =
        statRows.map((stat) => {
          return new SummaryMetric(stat, self);
        });

  var summaryMetricsTrie = new SummaryMetricsTrie(metrics);

  var addTimes = {};
  var addN = 0;
  var changeTimes = {};
  var changeN = 0;

  var handle = TaskAttempts.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId }).observeChanges({
    added: function(_id, task) {
      var addStart = moment();
      taskById[_id] = task;
      summaryMetricsTrie.walk(task, undefined, self);
      var d = moment() - addStart;
      if (!(d in addTimes)) {
        addTimes[d] = 0;
      }
      addTimes[d]++;
      addN++;
      if (addN === 1000) {
        console.log("\t%d.%d added: %s", stageId, attemptId, JSON.stringify(addTimes));
        addTimes = {};
        addN = 0;
      }
    },
    changed: function(_id, fields) {
      var changeStart = moment();
      if (!(_id in taskById)) {
        throw new Error("Task with _id " + _id + " not found. Fields: ", fields);
      }
      var task = taskById[_id];
      taskById[_id] = summaryMetricsTrie.walk(fields, task, self);
      var d = moment() - changeStart;
      if (!(d in changeTimes)) {
        changeTimes[d] = 0;
      }
      changeTimes[d]++;
      changeN++;
      if (changeN === 1000) {
        console.log("\t%d.%d changed: %s", stageId, attemptId, JSON.stringify(changeTimes));
        changeTimes = {};
        changeN = 0;
      }
    }
  });
  metrics.forEach(function (metric) {
    metric.initialize();
  }.bind(this));

  this.ready();
  var after = moment();
  console.log("stage-summary-metrics finished in %d ms", after - start);

  self.onStop(function () {
    handle.stop();
  });
});


