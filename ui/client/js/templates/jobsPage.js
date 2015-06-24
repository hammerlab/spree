
var columns = [
  { id: "id", label: "Job ID", cmpFn: sortBy("id"), template: 'id' },
  { id: "desc", label: "Description", cmpFn: sortBy("name") },
  startColumn,
  durationColumn,
  stagesColumn,
  tasksColumn
];

makeTable(
      columns, 'jobsPage', 'sorted', 'columns', 'jobRow', 'job', function() { return this; }, ['start', -1]
);

Template.jobsPage.helpers({

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
