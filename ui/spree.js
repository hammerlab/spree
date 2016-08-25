
Applications = new Mongo.Collection("apps");
RDDBlocks = new Mongo.Collection("rdd_blocks");
NonRDDBlocks = new Mongo.Collection("non_rdd_blocks");
Jobs = new Mongo.Collection("jobs");
Stages = new Mongo.Collection("stages");
StageAttempts = new Mongo.Collection("stage_attempts");
StageExecutors = new Mongo.Collection("stage_executors");
Tasks = new Mongo.Collection("tasks");
//TaskAttempts = new Mongo.Collection("task_attempts");
Executors = new Mongo.Collection("executors");
ExecutorThreadDumps = new Mongo.Collection("executor_thread_dumps");
RDDs = new Mongo.Collection("rdds");
RDDExecutors = new Mongo.Collection("rdd_executors");
Environment = new Mongo.Collection("environment");
StageSummaryMetrics = new Mongo.Collection("stage_summary_metrics");

Test = new Mongo.Collection("test");
