
// Application/Jobs page
Router.route("/a/:_appId", {
  waitOn: function() {
    return [
      Meteor.subscribe("jobs-page", this.params._appId),
      Meteor.subscribe("num-jobs", this.params._appId)
    ];
  },
  action: function() {
    this.render('jobsPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        env: Environment.findOne(),
        jobsTab: 1
      }
    });
  }
});

Template.jobsPage.helpers({

  showAll: function() {
    return !(Cookie.get("jobs-showAll") == false);
  },

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

  totalDuration: function() {
    // TODO(ryan): denormalize on to app?
    return this.all.jobs.reduce(
          function(sum, job) {
            return sum + duration(job)
          },
          0
    );
  },

  uptime: function() {
    return moment().unix()*1000 - this.app.time.start;
  },

  columns: function() {
    return [
      jobIdColumn,
      stageIDsColumn,
      jobNameColumn,
      startColumn,
      durationColumn,
      stageIdxsColumn,
      stagesColumn,
      taskIdxsColumn,
      tasksColumn
    ].concat(ioColumns);
  },

  jobs() {
    var selectors = [
      [ 'all', {} ],
      [ 'active', { started: true, ended: { $ne: true }} ],
      [ 'completed', { succeeded: true } ],
      [ 'failed', { succeeded: false } ]
    ];

    var jobsTables = { app: this.app };
    var opts = Cookie.get("jobs-table-opts") || {};
    selectors.forEach((arr) => {
      var name = arr[0];
      var selector = arr[1];
      var jobs = Jobs.find(selector, opts).fetch().map((job) => {
        var lastStage = Stages.findOne({ jobId: job.id }, { sort: { id: -1 } });
        job.name = lastStage && lastStage.name || "";
        return job;
      });
      jobsTables[name] = { jobs: jobs, num: jobs.length };
    });

    return jobsTables;
  }

});

function unsetShowAll() {
  Cookie.set("jobs-showAll", false);
}

function setShowAll() {
  Cookie.set("jobs-showAll", true);
}

Template.jobsPage.events({
  'click #active-link, click #completed-link, click #failed-link': unsetShowAll,
  'click #all-link': setShowAll
});

var jobIdColumn = new Column('id', 'Job ID', 'id', { truthyZero: true });
var stageIDsColumn = new Column(
      'stageIDs',
      'Stage IDs',
      'stageIDs',
      {
        render: function(job) {
          return job.stageIDs.map((stageID, idx) => {
            return <span key={stageID}>
              {idx ? ", " : ""}
              <a href={[ '', 'a', job.appId, 'stage', stageID ].join('/')}>{stageID}</a>
            </span>;
          });
        },
        renderKey: '',
        showByDefault: false
      }
);
var jobNameColumn = new Column(
      'name',
      'Description',
      'name',
      {
        render: function (job) {
          return <a href={[ "", "a", job.appId, "job", job.id ].join('/')}>{job.name}</a>;
        },
        renderKey: ''
      }
);

