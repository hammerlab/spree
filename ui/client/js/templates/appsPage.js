
var columns = [
  { id: 'id', label: 'App ID', sortBy: 'id' },
  nameColumn,
  { id: 'start', label: 'Started', sortBy: 'time.start', template: 'start' },
  { id: 'end', label: 'Completed', sortBy: 'time.end', template: 'end' },
  durationColumn,
  { id: 'user', label: 'User', sortBy: 'user' }
];

makeTable(
      columns, 'appsPage', 'sorted', 'columns', 'appRow', 'app', 'apps', ['start', -1]
);
