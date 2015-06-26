
// Applications page
Router.route("/", {
  waitOn: function() {
    return Meteor.subscribe("apps");
  },
  action:function() {
    this.render('appsPage', { data: { apps: Applications.find() } });
  }
});

// Application/Jobs page
Router.route("/a/:_appId", {
  waitOn: function() {
    return Meteor.subscribe("jobs-page", this.params._appId);
  },
  action: function() {
    var jobs = Jobs.find().map(function(job) {
      var lastStage = Stages.findOne({ jobId: job.id }, { sort: { id: -1 } });
      job.name = lastStage && lastStage.name || "";
      return job;
    });
    var completedJobs = jobs.filter(function(job) { return job.succeeded; });
    var activeJobs = jobs.filter(function(job) { return (job.started || job.time.start) && !job.ended; });
    var failedJobs = jobs.filter(function(job) { return job.succeeded == false; });
    this.render('jobsPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        all: { jobs: jobs, num: jobs.length },
        completed: { jobs: completedJobs, num: completedJobs.length },
        active: { jobs: activeJobs, num: activeJobs.length },
        failed: { jobs: failedJobs, num: failedJobs.length },
        env: Environment.findOne(),
        jobsTab: 1
      }
    });
  }
});

function getStagesData() {
  var attempts = StageAttempts.find().map(identity);

  var completed = attempts.filter(function(attempt) { return (attempt.ended || (attempt.time && attempt.time.end)) && !attempt.skipped && attempt.status == SUCCEEDED; });
  var active = attempts.filter(function(attempt) { return attempt.started && !attempt.ended; });
  var pending = attempts.filter(function(attempt) { return !attempt.started && !attempt.skipped; });
  var skipped = attempts.filter(function(attempt) { return attempt.skipped; });
  var failed = attempts.filter(function(attempt) { return attempt.ended && attempt.status == FAILED; });

  return {
    all: { stages: attempts, num: attempts.length },
    completed: { stages: completed, num: completed.length },
    active: { stages: active, num: active.length },
    pending: { stages: pending, num: pending.length },
    skipped: { stages: skipped, num: skipped.length },
    failed: { stages: failed, num: failed.length }
  };
}

// Job page
Router.route("/a/:_appId/job/:_jobId", {
  waitOn: function() {
    return Meteor.subscribe('job-page', this.params._appId, parseInt(this.params._jobId));
  },
  action: function() {
    this.render('jobPage', {
      data: jQuery.extend(getStagesData(), {
        appId: this.params._appId,
        app: Applications.findOne(),
        job: Jobs.findOne(),
        jobsTab: 1
      })
    });
  }
});

// Stages page
Router.route("/a/:_appId/stages", {
  waitOn: function() {
    return Meteor.subscribe('stages-page', this.params._appId);
  },
  action: function() {
    this.render('stagesPage', {
      data: jQuery.extend(getStagesData(), {
        appId: this.params._appId,
        app: Applications.findOne(),
        stagesTab: 1
      })
    });
  }
});

function sortNumber(a,b) {
  return a - b;
}

function makeSummaryStats(name, arr) {
  var n = arr.length;
  return {
    name: name,
    stats: [
      arr[0],
      arr[Math.floor(n/4)],
      arr[Math.floor(n/2)],
      arr[Math.floor(3*n/4)],
      arr[n-1]
    ]
  }
}


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


// StageAttempt page
Router.route("/a/:_appId/stage/:_stageId", {
  waitOn: function() {
    return Meteor.subscribe(
          'stage-page',
          this.params._appId,
          parseInt(this.params._stageId),
          this.params.query.attempt ? parseInt(this.params.query.attempt) : 0
    );
  },
  action: function() {
    var stage = Stages.findOne();
    var stageAttempt = StageAttempts.findOne();
    if (!stageAttempt) {
      this.render('stagePage', {
        data: {
          appId: this.params._appId,
          app: Applications.findOne(),
          stageId: parseInt(this.params._stageId),
          attemptId: this.params.query.attempt ? parseInt(this.params.query.attempt) : 0,
          executors: [],
          stats: [],
          tasks: [],
          taskAttempts: [],
          stagesTab: 1
        }
      });
      return;
    }
    var executors = Executors.find().map(function(e) {
      if (stage && stage.id in e.stages && stageAttempt.id in e.stages[stage.id]) {
        var eStage = e.stages[stage.id][stageAttempt.id];
        e.metrics = eStage.metrics;
        e.taskCounts = eStage.taskCounts;
        delete e['stages'];
      }
      return e;
    });

    var stats = [];
    statRows.forEach(function(c) {
      var name = c[0];
      var fn = c[1];
      var tpl = c[2];
      if (typeof fn == 'string') {
        fn = acc(fn);
      }
      var tasks = TaskAttempts.find({ stageId: stage.id, stageAttemptId: stageAttempt.id }).map(identity).sort(sortBy(fn));
      var n = tasks.length;
      var max = fn(tasks[n-1]);
      if (max) {
        stats.push({
          id: name,
          template: tpl,
          min: fn(tasks[0]),
          tf: fn(tasks[n/4]),
          median: fn(tasks[n/2]),
          sf: fn(tasks[3*n/4]),
          max: max
        });
      }
    });

    this.render('stagePage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        stage: stage,
        stageAttempt: stageAttempt,
        stageId: stage.id,
        attemptId: stageAttempt.id,
        stats: stats,
        tasks: Tasks.find(),
        taskAttempts: TaskAttempts.find().map(function(task) {
          var executor = Executors.findOne({ id: task.execId });
          task.host = executor.host;
          task.port = executor.port;
          return task;
        }),
        executors: executors,
        stagesTab: 1
      }
    });
  }
});

// Storage page
Router.route("/a/:_appId/storage", {
  waitOn: function() {
    return Meteor.subscribe("rdds-page", this.params._appId);
  },
  action: function() {
    this.render('storagePage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        rdds: RDDs.find(),
        storageTab: 1
      }
    });
  }
});

// RDD Page
Router.route("/a/:_appId/rdd/:_rddId", {
  waitOn: function() {
    return Meteor.subscribe('rdd-page', this.params._appId, parseInt(this.params._rddId));
  },
  action: function() {
    var executors = Executors.find().map(function(executor) {
      var executorRDD = executor.blocks.rdd[this.params._rddId];
      ['MemorySize', 'ExternalBlockStoreSize', 'DiskSize', 'numBlocks'].forEach(function(key) {
        if (key in executorRDD) {
          executor[key] = executorRDD[key];
        }
      }.bind(this));
      if ('blocks' in executorRDD) {
        executor['blocks'] = executorRDD['blocks'];
      } else {
        delete executor['blocks'];
      }
      return executor;
    }.bind(this));

    this.render('rddPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        rdd: RDDs.findOne(),
        executors: executors,
        storageTab: 1
      }
    });
  }
});

// Environment Page
Router.route("/a/:_appId/environment", {
  waitOn: function() {
    return Meteor.subscribe('environment-page', this.params._appId);
  },
  action: function() {
    this.render("environmentPage", {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        env: Environment.findOne(),
        environmentTab: 1
      }
    });
  }
});

// Executors Page
Router.route("/a/:_appId/executors", {
  waitOn: function() {
    return Meteor.subscribe('executors-page', this.params._appId);
  },
  action: function() {
    this.render("executorsPage", {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        executors: Executors.find(),
        executorsTab: 1
      }
    });
  }
});
