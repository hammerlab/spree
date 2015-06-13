
Template.executorsPage.helpers({
  numExecutors: function() {
    return Executors.find().count();
  }
});
