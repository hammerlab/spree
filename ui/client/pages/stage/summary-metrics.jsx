
var statsColumns = [
  { id: 'id', label: 'Metric', sortBy: 'id' },
  { id: 'min', label: 'Min', sortBy: 'min' },
  { id: 'tf', label: '25th Percentile', sortBy: 'tf' },
  { id: 'median', label: 'Median', sortBy: 'median' },
  { id: 'sf', label: '75th Percentile', sortBy: 'sf' },
  { id: 'max', label: 'Max', sortBy: 'max' }
];

SummaryMetricsTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    return {
      stats: this.props.stats.map((stat) => {
        if (stat.template == 'bytes') {
          stat.render = formatBytes;
        } else if (stat.template == 'time') {
          stat.render = formatTime;
        }
        return stat;
      })
    };
  },
  render() {
    var tc = this.props.taskCounts || {};
    var rightTitle = <span>
      {tc.num || 0} total,{' '}
      {tc.running || 0} active,{' '}
      {tc.failed || 0} failed,{' '}
      {tc.succeeded || 0} succeeded
    </span>;

    return <div>
      <Table
            title="Summary Metrics"
            rightTitle={rightTitle}
            defaultSort={{ id: 'id' }}
            selectRows={true}
            data={this.props.stats}
            columns={statsColumns}
            class="stats"
            allowEmptyColumns={true}
            hideEmptyRows={true}
            disableSort={true}
            />
    </div>;
  }
});

