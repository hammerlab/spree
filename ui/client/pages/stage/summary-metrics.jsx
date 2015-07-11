
var statsColumns = [
  new Column('id', 'Metric', 'label'),
  new Column('min', 'Min', 'stats.min'),
  new Column('tf', '25th Percentile', 'stats.tf'),
  new Column('median', 'Median', 'stats.median'),
  new Column('sf', '75th Percentile', 'stats.sf'),
  new Column('max', 'Max', 'stats.max')
];

SummaryMetricsTable = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    return {
      stage: StageAttempts.findOne(),
      stats: SummaryMetrics.find().fetch().map((stat) => {
        stat.id = stat._id;
        if (stat.render == 'bytes') {
          stat.render = formatBytes;
        } else if (stat.render == 'time') {
          stat.render = formatTime;
        } else {
          stat.render = function(x) { if (!x) return '-'; return x; };
        }
        return stat;
      })
    };
  },
  render() {
    var tc = this.data.stage && this.data.stage.taskCounts || {};
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
            data={this.data.stats}
            columns={statsColumns}
            class="stats"
            allowEmptyColumns={true}
            hideEmptyRows={true}
            hideRowCount={true}
            paginate={false}
            disableSort={true}
            />
    </div>;
  }
});

