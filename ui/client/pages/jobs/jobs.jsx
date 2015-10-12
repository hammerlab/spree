
// Application/Jobs page
Router.route("/a/:_appId", {
  waitOn: function() {
    return [
      Meteor.subscribe("jobs-page", this.params._appId),
      Meteor.subscribe("job-counts", { appId: this.params._appId })
    ];
  },
  action: function() {
    this.render('jobsPage', {
      data: {
        appId: this.params._appId,
        app: Applications.findOne(),
        env: Environment.findOne(),
        counts: JobCounts.findOne(),
        jobsTab: 1
      }
    });
  },
  name: 'jobs'
});

var jobIdColumn = new Column(
      'id',
      'Job ID',
      'id',
      {
        render: function (job) {
          return <a href={[ "", "a", job.appId, "job", job.id ].join('/')}>{job.id}</a>;
        },
        renderKey: '',
        truthyZero: true
      }
);
var stageIDsColumn = new Column(
      'stageIDs',
      'Stage IDs',
      'stageIDs',
      {
        render: function(job) {
          return (job.stageIDs || []).sort(function(a,b) { return a - b; }).map((stageID, idx) => {
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
          return <a href={[ "", "a", job.appId, "job", job.id ].join('/')}>
            {job.stageNames ? job.stageNames[job.stageNames.length-1] : "???"}
          </a>;
        },
        renderKey: ''
      }
);

var jobColumns = [
  jobIdColumn,
  jobNameColumn,
  lastUpdatedColumn,
  stageIDsColumn,
  startColumn,
  durationColumn,
  stageIdxsColumn,
  stagesColumn,
  taskIdxsColumn,
  tasksColumn
].concat(ioColumns());

Template.jobsPage.helpers({

  showAll: function(total) {
    return !total || Cookie.get("jobs-showAll") !== false;
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

  getTableData(data, label, name) {
    return getTableData(data.app, "jobs", label + " Jobs", data.counts[name], label + "Jobs", name, jobColumns, name === "all");
  }

});

Template.jobsPage.events({
  'click #active-link, click #completed-link, click #failed-link': unsetShowAll("jobs"),
  'click #all-link': setShowAll("jobs")
});

