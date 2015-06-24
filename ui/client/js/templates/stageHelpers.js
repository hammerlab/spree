
var columns = [
  { label: 'Stage ID', id: 'id', sortBy: 'stageId' },
  { label: 'Description', id: 'desc', sortBy: 'name' },
  startColumn,
  durationColumn,
  tasksColumn
].concat(ioBytesColumns);

makeTable(
  columns, 'stagesTables', 'sorted', 'columns', 'stageRow', 'stage', function() { return this; }, ['start', -1]
);
