
Jobs = new Mongo.Collection("jobs")
Stages = new Mongo.Collection("stages")
Tasks = new Mongo.Collection("tasks")

function jobsAndStages(queryObj) {
  var jobs = Jobs.find(queryObj || {}, {sort: {id:-1}});

  var stageIDs = [];
  jobs.map(function(job) { stageIDs = stageIDs.concat(job.stageIDs); })

  var stages = Stages.find({ id: { $in: stageIDs } });

  var stagesByJobId = {}
  stages.map(function(stage) {
    if (!(stage.jobId in stagesByJobId)) {
      stagesByJobId[stage.jobId] = [];
    }
    stagesByJobId[stage.jobId].push(stage);
  });

  return { jobs: jobs, stages: stages, stagesByJobId: stagesByJobId };
}

Router.route("/", function() {
  this.render('jobsPage');
});

Router.route("/jobs", function() {
  this.render('jobsPage');
});

sigFigs = function(m, n) {
  n = n || 3;
  console.log("getting %d sigfigs for %d", n, m);
  var leftOfDecimal = Math.ceil(Math.log(m) / Math.log(10));
  return m.toFixed(Math.max(0, n - leftOfDecimal));
}

Router.route("/job/:_id", function() {
  console.log("params: %O", this.params._id);
  var job = Jobs.findOne( { id: parseInt(this.params._id) });
  if (!job) {
    this.render('jobPage');
    return;
  }
  var stages = Stages.find({ id: { $in: job.stageIDs }})
  this.render('jobPage', {
    data: {
      job: job,
      stages: stages
    }
  });
});

if (Meteor.isClient) {

  function formatTime(ms) {
    var S = 1000;
    var M = 60*S;
    var H = 60*M;
    var D = 24*H;

    if (ms < M) {
      if (ms < S) {
        return ms + 'ms';
      }
      return sigFigs(ms/1000) + 's';
    }

    var highestLevel = -1;
    var levels = [[D,'d'],[H,'h'],[M,'m'],[S,'s']/*,[1,'ms']*/];
    var r =
          levels.map(function(level, idx) {
            if (ms > level[0]) {
              if (highestLevel < 0) {
                highestLevel = idx;
              }
              var v = Math.floor(ms / level[0]);
              ms -= v*level[0];
              return v+level[1];
              return v;
            }
          });

    return [r[highestLevel], r[highestLevel+1]].join('');
  }

  Template.registerHelper("log", function(something) {
    console.log(something);
  });

  Template.registerHelper("formatDateTime", function(dt) {
    return moment(dt).format("YYYY/MM/DD HH:mm:ss");
  });

  Template.registerHelper("formatBytes", function(bytes) {
    if (!bytes) return "-";
    var base = 1024;
    var cutoff = 2;
    var levels = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    for (var i = 0; i < levels.length; i++) {
      var order = levels[i];
      if (bytes < cutoff*base || order == 'PB') {
        var r = sigFigs(bytes) + order;
        console.log("returning.. %s", r)
        return r;
      }
      bytes /= 1024;
    }
  });

  Template.registerHelper("jobStatus", function(job) {
    if (job.succeeded) return "SUCCEEDED";
    if (job.failed) return "FAILED";
    if (job.inProgress) return "RUNNING";
    return "UNKNOWN";
  });

  Template.registerHelper("formatDuration", function(start, end) {
    return end ? formatTime(end - start) : (formatTime(moment().unix()*1000 - start) + '...');
  });

  Template.jobRows.helpers({
    data: function() {
      return jobsAndStages();
    },

    rowClass: function(job) {
      if (job.succeeded) {
        return "succeeded";
      } else if (job.inProgress) {
        return "in-progress";
      } else if (job.failed) {
        return "failed";
      } else {
        return "";
      }
    },

    getJobName: function(job, stagesByJobId) {
      return Stages.findOne({ jobId: job.id }, { sort: { id: 1}}).name;
    },

    getJobDuration: function(job) {
      return job.time.end ?
            formatTime(job.time.end - job.time.start) :
            (formatTime(Math.max(0, moment().unix()*1000 - job.time.start)) + '...')
      ;
    }

  });

  Template.jobPage.helpers({
    completed: function(stageCounts) {
      return (stageCounts.num - stageCounts.running) || 0;
    }
  });

  Template.stageRow.helpers({
    getClass: function(stage) {
      if (stage.failureReason) {
        return "failed"
      }
      if (stage.time.end) {
        return "succeeded";
      }
      return "";
    }
  })
}
