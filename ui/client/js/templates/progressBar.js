
Template.progressBar.helpers({
  label: function(counts) {
    return (counts && counts.succeeded || "") + "/" + (counts && counts.num || "") +
          (counts && counts.running ? (" (" + counts.running + " running)") : "");
  },
  completedPercentage: function(counts) {
    return (counts && (counts.succeeded / counts.num) || "") * 100 + '%';
  },
  runningPercentage: function(counts) {
    return (counts && (counts.running / counts.num) || "") * 100 + '%';
  }
});

