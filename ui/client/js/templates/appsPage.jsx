
AppLink = React.createClass({
  render() {
    return <a href={"/a/" + this.props.id}>{this.props.id}</a>;
  }
});

var columns = [
  { id: 'id', label: 'App ID', sortBy: 'id', render: (id) => { return <AppLink id={id} /> } },
  nameColumn,
  { id: 'start', label: 'Started', sortBy: 'time.start', template: 'start', render: formatDateTime },
  { id: 'end', label: 'Completed', sortBy: 'time.end', template: 'end', render: formatDateTime },
  durationColumn,
  { id: 'user', label: 'User', sortBy: 'user' }
];

AppsTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    return {
      apps: Applications.find().fetch()
    };
  },
  render() {
    return <Table
          name="apps"
          defaultSort={{ id:'id', dir: -1 }}
          data={this.data.apps}
          columns={columns} />

  }
});

Template.appsPage.helpers({
  AppsTable: () => { return AppsTable; }
});

