
Template.jobPage.helpers({
  completed: function(stageCounts) {
    return (stageCounts && (stageCounts.num - stageCounts.running)) || 0;
  },
  setTitle: function(data) {
    if (data && data.job && data.job.id !== undefined) {
      document.title = "Job " + data.job.id + " - Spark";
    }
  }
});

Template.registerHelper("jobStatus", function(job) {
  if (!job) { return ""; }
  if (job.succeeded) return "SUCCEEDED";
  if (job.failed) return "FAILED";
  if (job.inProgress) return "RUNNING";
  return "UNKNOWN";
});

