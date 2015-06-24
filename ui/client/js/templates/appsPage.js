
var columns = [
  { id: 'id', label: 'App ID', cmpFn: sortBy('id') },
  { id: 'name', label: 'App Name', cmpFn: sortBy('name') },
  { id: 'start', label: 'Started', cmpFn: sortBy('time.start') },
  { id: 'end', label: 'Completed', cmpFn: sortBy('time.end') },
  { id: 'duration', label: 'Duration', cmpFn: sortBy(function(a) { return a.time.end - a.time.start; }) },
  { id: 'user', label: 'User', cmpFn: sortBy('user') }
];

var columnsById = byId(columns, 'appRow', 'app');

Template.appsPage.helpers({
  applications: function() {
    var sort = Session.get('app-table-sort') || ['start', -1];
    var cmpFn = columnsById[sort[0]].cmpFn;
    var apps = Applications.find().map(function(app) { return app; });
    if (cmpFn) {
      return sort[1] == 1 ? apps.sort(cmpFn) : apps.sort(cmpFn).reverse();
    } else {
      return sort[1] == 1 ? apps.sort() : apps.sort().reverse();
    }
  },

  columns: function() { return columns; }
});

