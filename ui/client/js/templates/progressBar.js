
Template.progressBar.helpers({
  label: function(counts) {
    return (counts.succeeded || 0) + "/" + counts.num + (counts.running ? (" (" + counts.running + " running)") : "");
  },
  completedPercentage: function(bar) {
    return (bar.succeeded / bar.num) * 100 + '%';
  },
  runningPercentage: function(bar) {
    return (bar.running / bar.num) * 100 + '%';
  }
});

