
getStagesData = function() {
  var attempts = StageAttempts.find().fetch();

  var completed = attempts.filter(function(attempt) { return (attempt.ended || (attempt.time && attempt.time.end)) && !attempt.skipped && attempt.status == SUCCEEDED; });
  var active = attempts.filter(function(attempt) { return attempt.started && !attempt.ended; });
  var pending = attempts.filter(function(attempt) { return !attempt.started && !attempt.skipped; });
  var skipped = attempts.filter(function(attempt) { return attempt.skipped; });
  var failed = attempts.filter(function(attempt) { return attempt.ended && attempt.status == FAILED; });

  return {
    all: { stages: attempts, num: attempts.length },
    completed: { stages: completed, num: completed.length },
    active: { stages: active, num: active.length },
    pending: { stages: pending, num: pending.length },
    skipped: { stages: skipped, num: skipped.length },
    failed: { stages: failed, num: failed.length }
  };
}

