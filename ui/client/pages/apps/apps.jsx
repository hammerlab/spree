
// Applications page
Router.route("/", {
  waitOn: function() {
    return Meteor.subscribe("apps");
  },
  action:function() {
    this.render('appsPage', { data: { apps: Applications.find() } });
  }
});

var columns = [
  { id: 'id', label: 'App ID', sortBy: 'id', render: (id) => { return <a href={"/a/" + id}>{id}</a>; } },
  nameColumn,
  { id: 'start', label: 'Started', sortBy: 'time.start', render: formatDateTime },
  { id: 'end', label: 'Completed', sortBy: 'time.end', render: formatDateTime },
  durationColumn,
  { id: 'user', label: 'User', sortBy: 'user' }
];

Template.appsPage.helpers({
  columns: () => { return columns; }
});
