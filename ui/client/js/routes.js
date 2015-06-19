
// Applications page
Router.route("/", {
  waitOn: function() {
    return Meteor.subscribe("apps");
  },
  action:function() {
    this.render('appsPage');
  }
});

// Application/Jobs page
Router.route("/a/:_appId", {
  waitOn: function() {
    return Meteor.subscribe("jobs-page", this.params._appId);
  },
  action: function() {
    var jobs = Jobs.find({}, { sort: { id: -1 } });
    var jobIDs = jobs.map(function(job) { return job.id; });
    this.render('jobsPage', {
      data: {
        appId: this.params._appId,
        jobs: jobs,
        stages: Stages.find(),
        jobsTab: 1
      }
    });
  }
});

// Job page
Router.route("/a/:_appId/job/:_jobId", {
  waitOn: function() {
    return Meteor.subscribe('job-page', this.params._appId, parseInt(this.params._jobId));
  },
  action: function() {
    this.render('jobPage', {
      data: {
        appId: this.params._appId,
        job: Jobs.findOne(),
        stages: Stages.find({}, { sort: { id: -1 } }),
        attempts: StageAttempts.find({}, { sort: { stageId: -1, id: -1 }}),
        jobsTab: 1
      }
    });
  }
});

Router.route("/a/:_appId/stages", {
  waitOn: function() {
    return Meteor.subscribe('stages-page', this.params._appId);
  },
  action: function() {
    this.render('stagesPage', {
      data: {
        appId: this.params._appId,
        stages: Stages.find(),
        attempts: StageAttempts.find(),
        stagesTab: 1
      }
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
    this.render('stagePage', {
      data: {
        appId: this.params._appId,
        stage: Stages.findOne(),
        stageAttempt: StageAttempts.findOne(),
        tasks: Tasks.find(),
        taskAttempts: TaskAttempts.find({}, { sort: { index: 1 } }),
        executors: Executors.find(),
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
    this.render('rddPage', {
      data: {
        appId: this.params._appId,
        rdd: RDDs.findOne(),
        executors: Executors.find(),
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
