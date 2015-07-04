
var columns = [
  { id: "id", label: "Job ID", sortBy: "id", template: 'id' },
  { id: "desc", label: "Description", sortBy: "name" },
  startColumn,
  durationColumn,
  stagesColumn,
  tasksColumn
];

makeTable(columns, 'jobsPage', 'job', null, ['start', -1]);

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
