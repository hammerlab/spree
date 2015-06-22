
var columns = [
  { id: "id", label: "Job ID", cmpFn: sortBy("job.id") },
  { id: "desc", label: "Description", cmpFn: sortBy("name") },
  { id: "start", label: "Submitted", cmpFn: sortBy("job.time.start") },
  { id: "duration", label: "Duration", cmpFn: sortBy(function(x) { return x.job.time.end - x.job.time.start; }) },
  { id: "stages", label: "Stages: Succeeded/Total", cmpFn: sortBy(function(x) { return x.job.stageCounts.succeeded; }) },
  { id: "tasks", label: "Tasks: Succeeded/Total", cmpFn: sortBy(function(x) { return x.job.taskCounts.succeeded; }) }
];

var columnsById = {};
columns.forEach(function(column) {
  columnsById[column.id] = column;
  column.template = 'jobRow-' + column.id;
  column.table = 'job-table';
});


function attachNameAndAppId(jobs, appId) {
  var sort = Session.get('job-table-sort') || ['start', -1];
  var cmpFn = columnsById[sort[0]].cmpFn;
  var joined = jobs.map(function(job) {
    var stage = Stages.findOne({ jobId: job.id }, { sort: { id: -1 } });
    var name = stage && stage.name || "";
    return {
      job: job,
      appId: appId,
      name: name
    }
  });
  if (cmpFn) {
    return sort[1] == 1 ? joined.sort(cmpFn) : joined.sort(cmpFn).reverse();
  } else {
    return sort[1] == 1 ? joined.sort() : joined.sort().reverse();
  }
}

Template.jobsPage.helpers({

  columns: function() { return columns; },

  schedulingMode: function(env) {
    if (env && env.spark) {
      for (var i in env.spark) {
        if (env.spark[i][0] == 'spark.scheduler.mode') {
          return env.spark[i][1];
        }
      }
    }
    return "Unknown";
  },

  completedJobs: function() {
    return attachNameAndAppId(Jobs.find({ succeeded: true }, { sort: { id: -1 } }), this.appid)
  },

  numCompletedJobs: function() {
    return Jobs.find({ succeeded: true }).count();
  },

  activeJobs: function() {
    return attachNameAndAppId(Jobs.find({ started: true, ended: { $exists: false } }, { sort: { id: -1 } }), this.appId);
  },

  numActiveJobs: function() {
    return Jobs.find({ started: true, ended: { $exists: false } }).count();
  },

  failedJobs: function() {
    return attachNameAndAppId(Jobs.find({ succeeded: false }, { sort: { id: -1 } }), this.appId);
  },

  numFailedJobs: function() {
    return Jobs.find({ succeeded: false }).count();
  }

});

Template["jobRow-duration"].helpers({
  getJobDuration: function(job) {
    return job.time.end ?
          formatTime(job.time.end - job.time.start) :
          (formatTime(Math.max(0, moment().unix()*1000 - job.time.start)) + '...')
          ;
  }
});
