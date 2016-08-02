
function stageAttemptId(attempt) {
  return attempt && (attempt.stageId + '.' + attempt.id);
}

function stageAttemptUrl(attempt) {
  return [ '', 'a', attempt.appId, 'stage', attempt.stageId ].join('/') + (attempt.id ? ('?attempt=' + attempt.id) : '');
}

var stageIDColumn = new Column(
      'id',
      'Stage ID',
      'stageId',
      {
        render: (attempt) => {
          return <a href={stageAttemptUrl(attempt)}>{
            attempt.stageId + (attempt.id ? (" (" + attempt.id + ")") : "")
          }</a>;
        },
        renderKey: '',
        truthyZero: true
      }
);

// == Stage name column with details ==
// React element to display 'pre' with details
StageDetails = React.createClass({
  mixins: [ReactMeteorData],
  getMeteorData() {
    const subscription1 = Meteor.subscribe('stage-details', this.props.appId, this.props.stageId);
    const subscription2 = Meteor.subscribe('rdds', this.props.appId);
    if (subscription1.ready() && subscription2.ready()) {
      var stage = Stages.findOne(
        {appId: this.props.appId, id: this.props.stageId},
        {fields: {name: true, details: true, rddIDs: true}});
      var cachedRDDs = RDDs.find(
        {appId: this.props.appId, id: {$in: stage.rddIDs}},
        {fields: {appId: true, id: true, name: true}}
      ).fetch();
      return {ready: true, stage: stage, rdds: cachedRDDs};
    } else {
      return {return: false, stage: null, rdds: []};
    }
  },
  render() {
    if (this.data.ready) {
      var rddsToDisplay = null;
      if (this.data.rdds.length) {
        rddsToDisplay = [
          // title to display when there are cached RDDs, id = -1 for eliminating key collisions.
          <span key="-1">RDDs:</span>,
          // all cached RDDs' links with some adjacent spaces
          this.data.rdds.map(function(rdd) {
            var href = ['', 'a', rdd.appId, 'rdd', rdd.id].join('/');
            return <span key={rdd.id}>
              <span>&nbsp;</span>
              <a href={href}>{rdd.name}</a>
            </span>;
          })
        ];
      }

      return <div>
        {rddsToDisplay}
        <pre className='code'>{this.data.stage.details}</pre>
      </div>;
    } else {
      return <span></span>;
    }
  }
});

// Stage name element to display details when clicked
StageNameElement = React.createClass({
  getInitialState() {
    return {
      toggle: false
    };
  },
  handleClick() {
    this.setState({toggle: !this.state.toggle});
  },
  render() {
    var header = <div className='stage-name-container'>
      <a href={this.props.url}>{this.props.name}</a>
      <span className='expand-details' onClick={this.handleClick}>+ details</span>
    </div>;
    if (this.state.toggle) {
      return <div>{header}<StageDetails appId={this.props.appId} stageId={this.props.stageId} /></div>;
    } else {
      return header;
    }
  }
});

var stageNameColumn = new Column(
  'desc',
  'Description',
  'name',
  {
    render: (attempt) => {
      const url = stageAttemptUrl(attempt);
      return <StageNameElement appId={attempt.appId} stageId={attempt.stageId} name={attempt.name} url={url}/>;
    },
    renderKey: ''
  }
);

var stageColumns = (name) => {
  return [
    stageIDColumn,
    stageNameColumn,
    lastUpdatedColumn,
    startColumn,
    durationColumn
  ]
        .concat(name === 'all' ? [ statusColumn ] : [])
        .concat([
          taskIdxsColumn,
          tasksColumn
        ])
        .concat(ioColumns());
};

Template.stagesTables.helpers({
  showAll: function(total) {
    return !total || Cookie.get('stages-showAll') !== false;
  },
  getTableData(data, label, name) {
    return getTableData(
          data.app,
          "stages",
          label + " Stages",
          data.counts[name],
          label + "Stages",
          name,
          stageColumns(name),
          name === "all",
          data.job
    );
  }
});

Template.stagesTables.events({
  'click #active-link, click #succeeded-link, click #failed-link, click #pending-link, click #skipped-link': unsetShowAll("stages"),
  'click #all-link': setShowAll("stages")
});

getTableData = function(app, objType, title, total, collection, titleId, columns, showIfEmpty, oracle) {
  var id = titleId + "-" + objType;
  return {
    title: title,
    titleId: titleId,
    total: total,
    name: id,
    collection: collection,
    subscriptionFn: (opts) => {
      var findObj = { appId: app.id };
      if (objType === 'stages' && oracle !== null && oracle !== undefined) {
        findObj.jobId = oracle.id;
      }
      return Meteor.subscribe(id, findObj, opts);
    },
    show: total || (showIfEmpty === true),
    columns: columns,
    keyFn: objType == 'stages' && stageAttemptId,
    component: Table,
    columnOracle: oracle || app,
    sortId: 'id',
    sortDir: -1
  };
};
