
PENDING = undefined;
RUNNING = 1;
SUCCEEDED = 2;
FAILED = 3;
SKIPPED = 4;
REMOVED = 5;

statuses = {
  undefined: "PENDING",
  1: "RUNNING",
  2: "SUCCESS",
  3: "FAILED",
  4: "SKIPPED",
  5: "REMOVED"
};

lstatuses = {
  undefined: "pending",
  1: "running",
  2: "succeeded",
  3: "failed",
  4: "skipped",
  5: "removed"
};

// function to determine whether or not application is running or pending
// status <= 1 or undefined
isAppRunningQuery = function() {
  return {$or: [{status: {$lte: 1}}, {status: undefined}]};
}

// function to return completed application status (completed, removed, skipped, failed)
// status > 1
isAppCompletedQuery = function() {
  return {status: {$gt: 1}};
}
