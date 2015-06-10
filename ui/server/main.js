
console.log("Starting server with Mongo URL: " + process.env.MONGO_URL);

function parseMongoUrl(url) {
  var m = url.match("^mongodb://([^:]+):([0-9]+)/(.*)$")
  if (!m) return {};
  return {
    host: m[1],
    port: parseInt(m[2]),
    db: m[3],
    url: url,
    shortUrl: url.substr("mongodb://".length)
  };
}

Meteor.publish('mongoUrl', function () {
  this.added('mongoUrl', '1', parseMongoUrl(process.env.MONGO_URL));
  this.ready();
});


// Apps page
Meteor.publish("apps", function() {
  return Applications.find();
});


// Jobs page
Meteor.publish("jobs", function(appId) {
  return Jobs.find({appId: appId}, { sort: { id: -1 } });
});
Meteor.publish("last-stages", function(appId, jobIds) {
  var jobs = Jobs.find({ appId: appId, id: { $in: jobIds }});
  var lastStageIDs = jobs.map(function(job) {
    return Math.max.apply(null, job.stageIDs);;
  });
  return Stages.find({ appId: appId, id: { $in: lastStageIDs }});
});


// Job page
Meteor.publish("job", function(appId, jobId) {
  return Jobs.find({appId: appId, id: jobId});
});
Meteor.publish("job-stages", function(appId, jobId) {
  return Stages.find({ appId: appId, jobId: jobId }, { sort: { id: -1 }});
});


// Stages page
Meteor.publish("stages", function(appId) {
  return Stages.find({ appId: appId });
});


// Stage page
Meteor.publish("stage", function(appId, stageId, attemptId) {
  return Stages.find({ appId: appId, id: stageId, attempt: attemptId });
});
Meteor.publish("tasks", function(appId, stageId, attemptId) {
  return Tasks.find({ appId: appId, stageId: stageId, stageAttemptId: attemptId });
});


// Storage page
Meteor.publish("rdds", function(appId) {
  return RDDs.find({
    appId: appId,
    $or: [
      { "storageLevel.useDisk": true },
      { "storageLevel.useMemory": true },
      { "storageLevel.useOffHeap": true },
      { "storageLevel.deserialized": true },
      { "storageLevel.replication": { $ne: 1} }
    ]
  });
});
