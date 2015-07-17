
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
        render: (attempt) => { return <a href={stageAttemptUrl(attempt)}>{attempt.name}</a>; },
        renderKey: ''
      }
);

var stageColumns = [
  stageIDColumn,
  stageNameColumn,
  lastUpdatedColumn,
  startColumn,
  durationColumn,
  taskIdxsColumn,
  tasksColumn
].concat(ioColumns);

Template.stagesTables.helpers({
  showAll: function(total) {
    return !total || Cookie.get('stages-showAll') !== false;
  },
  getTableData(data, label, name) {
    return getTableData(data.app, "stages", label + " Stages", data.counts[name], label + "Stages", name, stageColumns, name === "all", data.job);
  }
});

Template.stagesTables.events({
  'click #active-link, click #succeeded-link, click #failed-link, click #pending-link, click #skipped-link': unsetShowAll("stages"),
  'click #all-link': setShowAll("stages")
});

getTableData = function(app, objType, title, total, collection, titleId, columns, showIfEmpty, oracle) {
  return {
    title: title,
    titleId: titleId,
    total: total,
    name: objType,
    collection: collection,
    subscriptionFn: (opts) => {
      var findObj = { appId: app.id };
      if (objType === 'stages' && oracle !== null && oracle !== undefined) {
        findObj.jobId = oracle.id;
      }
      return Meteor.subscribe(titleId + "-" + objType, findObj, opts);
    },
    show: total || (showIfEmpty === true),
    columns: columns,
    keyFn: objType == 'stages' && stageAttemptId,
    component: Table,
    columnOracle: oracle || app
  };
};

