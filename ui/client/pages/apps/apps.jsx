
// Applications page
Router.route("/", {
  waitOn: function() {
    var opts = Cookie.get("apps-table-opts") || {};
    if (!('limit' in opts)) {
      opts.limit = 100;
    }
    if (!('sort' in opts)) {
      opts.sort = { id: -1 };
    }
    return [
      Meteor.subscribe("apps", opts),
      Meteor.subscribe("num-applications")
    ];
  },
  action:function() {
    this.render('appsPage', { data: { apps: Applications.find() } });
  }
});

var columns = [
  new Column('id', 'App ID', 'id', { render: (id) => { return <a href={"/a/" + id}>{id}</a>; }, defaultSort: -1 }),
  nameColumn,
  lastUpdatedColumn,
  new Column('start', 'Started', 'time.start', { render: formatDateTime }),
  new Column('end', 'Completed', 'time.end', { render: formatDateTime }),
  durationColumn,
  new Column('executors', 'Executors', 'executorCounts.running'),
  new Column('executorsrm', 'Executors Removed', 'executorCounts.removed', { showByDefault: false }),
  new Column('user', 'User', 'user')
];

Template.appsPage.helpers({
  columns: () => { return columns; }
});
