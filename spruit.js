
JobStarts = new Mongo.Collection("job_starts");
JobEnds = new Mongo.Collection("job_ends");
TaskStarts = new Mongo.Collection("task_starts");
TaskEnds = new Mongo.Collection("task_ends");
StageStarts = new Mongo.Collection("stage_starts");
StageEnds = new Mongo.Collection("stage_ends");

if (Meteor.isClient) {

  function formatTime(ms) {
    return ms + "ms";
  }

  Template.registerHelper("log", function(something) {
    console.log(something);
  });

  Template.registerHelper("formatDateTime", function(dt) {
    return moment(dt).format("YYYY/MM/DD HH:mm:ss");
  });

  Template.jobRows.helpers({
    jobs: function() {
      return JobStarts.find();
    },

    getJobDuration: function(jobStart) {
      var jobEnd = JobEnds.findOne({jobId: jobStart.jobId});
      if (!jobEnd) return null;
      console.log("jobEnd: %O", jobEnd);
      return formatTime(jobEnd.time - jobStart.time);
    },

    getSucceededStages: function(jobStart) {
      var query = {
        $or: jobStart.stageInfos.map(
              function(stageInfo) {
                return  {
                  stageId: stageInfo.stageId,
                  attemptId: stageInfo.attemptId
                };
              }
        )
      }
      return StageEnds.find(query).count();
    },

    getSucceededTasks: function(jobStart) {
      var query = {
        $or: jobStart.stageInfos.map(function (stageInfo) {
          return {
            stageId: stageInfo.stageId,
            stageAttemptId: stageInfo.attemptId,
            "reason.success": true
          };
        })
      };
      return TaskEnds.find(query).count();
    },

    getStartedTasks: function(jobStart) {
      var query = {
        $or: jobStart.stageInfos.map(function (stageInfo) {
          return {
            stageId: stageInfo.stageId,
            stageAttemptId: stageInfo.attemptId
          };
        })
      };
      return TaskEnds.find(query).count();
    }
  });

}
