
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
var stageNameColumn = new Column(
      'desc',
      'Description',
      'name',
      {
        render: (attempt, app) => {
          var key = attempt.appId + "." + attempt.stageId + "." + attempt.id + ".details";
          var expanded = !!LocalStore.get(key);
          var showKillLink = app && app.driverUrl && (attempt.status == RUNNING || attempt.status == PENDING);
          return <div data-toggle="popover" title="foo" data-content="bar">
            {
                  showKillLink ?
                  <a href={app.driverUrl + "/stages/stage/kill?terminate=true&id=" + attempt.stageId} className="kill-link">
                    (kill)
                  </a> : null
                  }
            <a href={stageAttemptUrl(attempt)}>{attempt.name}</a>
            {
                  attempt.details ?
                  <span className="toggle-details" onClick={(e) => { LocalStore.set(key, !expanded); }}>
                    +details
                  </span> : null
                  }
            <div className={"stage-details" + (expanded ? '' : ' collapsed')}>
              <pre>{expanded ? attempt.details : ''}</pre>
            </div>
          </div>;
        },
        renderKey: ''
      }
);

var failingTaskIndexHistColumn = new Column(
      'tasks-failed',
      'Failing Task Hist',
      'failed',
      {
        renderKey: '',
        render(stageAttempt) {
          var failed = stageAttempt.failed;
          var failing = stageAttempt.failing;

          var app = Applications.findOne();
          var maxTaskFailures = app && app.maxTaskFailures || 4;

          var spans = [];
          for (var numFailures in failed) {
            if (!failed[numFailures] && !failing[numFailures]) continue;
            var blueGreenColor = parseInt(255 * (1 - numFailures / maxTaskFailures)).toString(16);
            if (blueGreenColor.length == 1) blueGreenColor = '0' + blueGreenColor;
            var color = '#FF' + blueGreenColor + blueGreenColor;
            spans.push(
                  <span
                        key={numFailures}
                        className="failure-hist-cell"
                        style={{backgroundColor: color}}>
                    {numFailures}: {failing[numFailures]}({failed[numFailures]})
                  </span>
            );
          }
          return <span className="failure-hist">{spans}</span>;
        }
      }
);

var failureTypeAbbrevMap = {
  ExecutorLostFailure: { name: 'ELF', color: '#DFD' },
  FetchFailure: { name: 'FF', color: '#FDD' },
  ExceptionFailure: { name: 'EF', color: '#DDF' },
  TaskCommitDenied: { name: 'TCD', color: '#FFD' },
  Success: { name: 'S', color: '#FFF' },
  TaskKilled: { name: 'TK', color: '#FDF' },
  undefined: { name: '??', color: '#DDD' }
};

var taskFailureTypeHistogramColumn = new Column(
      'failure-type-hist',
      'Failure Types',
      'failTypes',
      {
        render(failTypes) {
          var failedArr = [];
          for (var ft in failTypes) {
            failedArr.push([ft, failTypes[ft]]);
          }
          var spans = failedArr.map((arr, idx) => {
            var ft = arr[0];
            var num = arr[1];
            var attrs = failureTypeAbbrevMap[ft];
            if (!attrs) {
              console.error("Bad failure type:", ft);
              attrs = failureTypeAbbrevMap[undefined];
            }
            return <span
                  key={idx}
                  className="failure-type-hist-cell"
                  style={{ backgroundColor: attrs.color }}>
              {attrs.name}: {num}
            </span>;
          });
          return <span className="failure-type-hist">{spans}</span>;
        }
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
          tasksColumn,
          failingTaskIndexHistColumn,
          taskFailureTypeHistogramColumn
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

