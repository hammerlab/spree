
Jobs = new Mongo.Collection("jobs");
Stages = new Mongo.Collection("stages");
Tasks = new Mongo.Collection("tasks");
Executors = new Mongo.Collection("executors");

Router.route("/", function() {
  this.render('jobsPage');
});

Router.route("/jobs", function() {
  this.render('jobsPage');
});

Router.route("/job/:_id", function() {
  var id = parseInt(this.params._id)
  console.log("params: %O", id);
  var job = Jobs.findOne( { id: id });
  if (!job) {
    this.render('jobPage', { data: { job: {id:id}, stages: [] }});
    return;
  }
  var stages = Stages.find({ id: { $in: job.stageIDs }})
  this.render('jobPage', {
    data: {
      job: job,
      stages: stages
    }
  });
});

