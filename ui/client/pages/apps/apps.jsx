
// Applications page
Router.route("/", {
  waitOn: function() {
    return [
      Meteor.subscribe("apps"),
      Meteor.subscribe("num-applications")
    ];
  },
  action:function() {
    this.render('appsPage', { data: { apps: Applications.find() } });
  }
});

var columns = [
  new Column('id', 'App ID', 'id', { render: (id) => { return <a href={"/a/" + id}>{id}</a>; } }),
  nameColumn,
  new Column('start', 'Started', 'time.start', { render: formatDateTime }),
  new Column('end', 'Completed', 'time.end', { render: formatDateTime }),
  durationColumn,
  new Column('user', 'User', 'user')
];

Template.appsPage.helpers({
  columns: () => { return columns; }
});
