
Template.progressBar.helpers({
  label: function(counts) {
    return (counts.succeeded || 0) + "/" + counts.num + (counts.running ? (" (" + counts.running + " running)") : "");
  },
  completedPercentage: function(counts) {
    return (counts.succeeded / counts.num) * 100 + '%';
  },
  runningPercentage: function(counts) {
    return (counts.running / counts.num) * 100 + '%';
  }
});

