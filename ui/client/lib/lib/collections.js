
SummaryMetrics = new Mongo.Collection("summary-metrics");
NumStages = new Mongo.Collection("num-stage-attempts");

NumExecutors = new Mongo.Collection("num-executors");
NumStageExecutors = new Mongo.Collection("num-stage-executors");
NumRDDs = new Mongo.Collection("num-rdds");
NumRDDExecutors = new Mongo.Collection("num-rdd-executors");
NumRDDBlocks = new Mongo.Collection("num-rdd-blocks");
NumApplications = new Mongo.Collection("num-applications");

StageCounts = new Mongo.Collection("stage-counts");
AllStages = new Mongo.Collection("all-stages");
CompletedStages = new Mongo.Collection("succeeded-stages");
ActiveStages = new Mongo.Collection("running-stages");
FailedStages = new Mongo.Collection("failed-stages");
PendingStages = new Mongo.Collection("pending-stages");
SkippedStages = new Mongo.Collection("skipped-stages");

JobCounts = new Mongo.Collection("job-counts");
AllJobs = new Mongo.Collection("all-jobs");
CompletedJobs = new Mongo.Collection("succeeded-jobs");
ActiveJobs = new Mongo.Collection("running-jobs");
FailedJobs = new Mongo.Collection("failed-jobs");

ExecutorCounts = new Mongo.Collection("executor-counts");
AllExecutors = new Mongo.Collection("all-executors");
RemovedExecutors = new Mongo.Collection("removed-executors");
ActiveExecutors = new Mongo.Collection("running-executors");
