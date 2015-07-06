
// Applications page
Router.route("/", {
  waitOn: function() {
    return Meteor.subscribe("apps");
  },
  action:function() {
    this.render('appsPage', { data: { apps: Applications.find() } });
  }
});

var columns = [
  { id: 'id', label: 'App ID', sortBy: 'id', render: (id) => { return <a href={"/a/" + id}>{id}</a>; } },
  nameColumn,
  { id: 'start', label: 'Started', sortBy: 'time.start', render: formatDateTime },
  { id: 'end', label: 'Completed', sortBy: 'time.end', render: formatDateTime },
  durationColumn,
  { id: 'user', label: 'User', sortBy: 'user' }
];

Template.appsPage.helpers({
  columns: () => { return columns; }
});


var columns = [
  { id: "id", label: "Job ID", sortBy: "id" },
  { id: "desc", label: "Description", sortBy: "name" },
  startColumn,
  durationColumn,
  stagesColumn,
  tasksColumn
];

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
