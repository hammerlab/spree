
var columns = [
  { label: 'Stage ID', id: 'id', cmpFn: sortBy('stageId') },
  { label: 'Description', id: 'desc', cmpFn: sortBy('name') },
  startColumn,
  durationColumn,
  tasksColumn
].concat(ioBytesColumns);

makeTable(
  columns, 'stagesTables', 'sorted', 'columns', 'stageRow', 'stage', function() { return this; }, ['start', -1]
);
