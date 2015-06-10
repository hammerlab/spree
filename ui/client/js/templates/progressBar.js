
Template.progressBar.helpers({
  label: function(counts) {
    return (counts.succeeded || 0) + "/" + counts.num + (counts.running ? (" (" + counts.running + " running)") : "");
  },
  completedPercentage: function(bar) {
    var p = (bar.succeeded / bar.num) * 100 + '%';
    return p;
  },
  runningPercentage: function(bar) {
    var p = (bar.running / bar.num) * 100 + '%';
    return p;
  }
});

