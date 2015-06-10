
Template.jobPage.helpers({
  completed: function(stageCounts) {
    return (stageCounts && (stageCounts.num - stageCounts.running)) || 0;
  },
  setTitle: function(data) {
    console.log("setting job page title! %O", data);
    document.title = "Job " + data.job.id + " - Spark";
  }
});

