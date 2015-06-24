
var columns = [
  { id: 'id', label: 'App ID', cmpFn: sortBy('id') },
  nameColumn,
  { id: 'start', label: 'Started', cmpFn: sortBy('time.start'), template: 'start' },
  { id: 'end', label: 'Completed', cmpFn: sortBy('time.end'), template: 'end' },
  durationColumn,
  { id: 'user', label: 'User', cmpFn: sortBy('user') }
];

makeTable(
      columns, 'appsPage', 'applications', 'columns', 'appRow', 'app', function() { return this.apps.map(identity); }, ['start', -1]
);
