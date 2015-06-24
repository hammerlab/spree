
var columns = [
  { id: "id", label: "Job ID", cmpFn: sortBy("id"), template: 'id' },
  { id: "desc", label: "Description", cmpFn: sortBy("name") },
  startColumn,
  durationColumn,
  { id: "stages", label: "Stages: Succeeded/Total", cmpFn: sortBy("stageCounts.succeeded"), template: 'stages' },
  tasksColumn
];

var columnsById = byId(columns, 'jobRow', 'job');

function attachNameAndAppId(jobs/*, appId*/) {
  var sort = Session.get('job-table-sort') || ['start', -1];
  var cmpFn = columnsById[sort[0]].cmpFn;
  var joined = jobs.map(function(job) {
    var stage = Stages.findOne({ jobId: job.id }, { sort: { id: -1 } });
    job.name = stage && stage.name || "";
    return job;
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
    return attachNameAndAppId(Jobs.find({ succeeded: true }, { sort: { id: -1 } }))
  },

  numCompletedJobs: function() {
    return Jobs.find({ succeeded: true }).count();
  },

  activeJobs: function() {
    return attachNameAndAppId(Jobs.find({ started: true, ended: { $exists: false } }, { sort: { id: -1 } }));
  },

  numActiveJobs: function() {
    return Jobs.find({ started: true, ended: { $exists: false } }).count();
  },

  failedJobs: function() {
    return attachNameAndAppId(Jobs.find({ succeeded: false }, { sort: { id: -1 } }));
  },

  numFailedJobs: function() {
    return Jobs.find({ succeeded: false }).count();
  }

});
