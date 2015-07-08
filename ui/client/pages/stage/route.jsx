
var statRows = [
  ['Task Deserialization Time', 'metrics.ExecutorDeserializeTime', 'time'],
  ['Duration', duration, 'time'],
  ['Run Time', 'metrics.ExecutorRunTime', 'time'],
  ['GC Time', 'metrics.JVMGCTime', 'time'],
  ['Getting Result Time', 'GettingResultTime', 'time'],
  ['Result Serialization Time', 'metrics.ResultSerializationTime', 'time'],
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
    var appId = this.params._appId;
    var stageId = parseInt(this.params._stageId);
    var attemptId = this.params.query.attempt ? parseInt(this.params.query.attempt) : 0;
    return [
      Meteor.subscribe('stage-page', appId, stageId, attemptId, Cookie.get("tasks-table-opts"))
    ];
  },
  action: function() {
    var appId = this.params._appId;
    var stageId = parseInt(this.params._stageId);
    var attemptId = this.params.query.attempt ? parseInt(this.params.query.attempt) : 0;
    var stageAttempt = StageAttempts.findOne();

    if (!stageAttempt) {
      this.render('stagePage', {
        data: {
          appId: appId,
          app: Applications.findOne(),
          executors: Executors.find(),
          stats: [],
          taskAttempts: TaskAttempts.find(),
          stageId: stageId,
          attemptId: attemptId,
          stagesTab: 1
        }
      });
      return;
    }

    var stats = [];
    statRows.forEach(function(c) {
      var name = c[0];
      var fn = c[1];
      var tpl = c[2];
      if (typeof fn == 'string') {
        fn = acc(fn);
      }
      var tasks = TaskAttempts.find({ stageId: stageId, stageAttemptId: attemptId }).fetch().sort(makeCmpFn(fn));
      var n = tasks.length;
      stats.push({
        id: name,
        label: name,
        template: tpl,
        min: fn(tasks[0]),
        tf: fn(tasks[parseInt(n/4)]),
        median: fn(tasks[parseInt(n/2)]),
        sf: fn(tasks[parseInt(3*n/4)]),
        max: fn(tasks[n-1])
      });
    });

    this.render('stagePage', {
      data: {
        appId: appId,
        app: Applications.findOne(),
        stageAttempt: stageAttempt,
        stageId: stageId,
        attemptId: attemptId,
        stats: stats,
        taskAttempts: TaskAttempts.find(),
        executors: Executors.find(),
        stagesTab: 1
      }
    });
  }
});




