
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

var jobIdColumn = { label: 'Job ID', id: 'id', sortBy: 'id' };
var stageIDsColumn = {
  label: 'Stage IDs',
  id: 'stageIDs',
  sortBy: 'stageIDs',
  render: function(job) {
    return job.stageIDs.map((stageID, idx) => {
      return <span>
              {idx ? ", " : ""}
        <a href={[ '', 'a', job.appId, 'stage', stageID ].join('/')}>{stageID}</a>
            </span>;
    });
  },
  renderKey: '',
  showByDefault: false
};
var jobNameColumn = {
  label: 'Description',
  id: 'desc',
  sortBy: 'name',
  render: function (job) {
    return <a href={[ "", "a", job.appId, "job", job.id ].join('/')}>{job.name}</a>;
  },
  renderKey: ''
};

Template.jobsPage.helpers({
  columns: function() {
    return [
      jobIdColumn,
      stageIDsColumn,
      jobNameColumn,
      startColumn,
      durationColumn,
      stagesColumn,
      tasksColumn
    ].concat(ioBytesColumns);
  }
});
