
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

Template.registerHelper("tableData", function(objKey, title, objs, titleId, alwaysShow) {
  return {
    title: title + " (" + objs.num + ")",
    titleId: titleId,
    tableName: objKey + "-" + titleId,
    objs: objs[objKey],
    num: objs.num,
    show: objs.num || (alwaysShow === true),
    columns: columns
  };
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
