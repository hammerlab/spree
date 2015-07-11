
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

Template.registerHelper('getStageData', () => {
  var selectors = [
    [ 'all', {} ],
    [ 'active', { started: true, ended: { $ne: true }} ],
    [ 'completed', { status: SUCCEEDED } ],
    [ 'failed', { status: FAILED } ],
    [ 'pending', { $or: [ { started: { $exists: false } }, { started: false } ] } ],
    [ 'skipped', { skipped: true } ]
  ];

  var stagesTables = {};
  var opts = Cookie.get("stages-table-opts") || {};
  selectors.forEach((arr) => {
    var name = arr[0];
    var selector = arr[1];
    var stages = StageAttempts.find(selector, opts).fetch();
    stagesTables[name] = { stages: stages, num: stages.length };
  });

  return stagesTables;
});

Template.stagesTables.helpers({
  showAll: function() {
    return Cookie.get('stages-showAll') != false;
  },
  columns: function() {
    return [
      stageIDColumn,
      stageNameColumn,
      startColumn,
      durationColumn,
      tasksColumn,
      taskIdxsColumn
    ].concat(ioBytesColumns);
  }
});

function unsetShowAll() {
  Cookie.set("stages-showAll", false);
}

function setShowAll() {
  Cookie.set("stages-showAll", true);
}

Template.stagesTables.events({
  'click #active-link, click #completed-link, click #failed-link, click #pending-link, click #skipped-link': unsetShowAll,
  'click #all-link': setShowAll
});

Template.registerHelper("tableData", function(objType, title, objs, titleId, columns, alwaysShow) {
  return {
    title: title,
    titleId: titleId,
    totalCollection: objType == 'stages' ? 'NumStages' : 'NumJobs',
    name: objType,
    data: objs[objType],
    num: objs.num,
    show: objs.num || (alwaysShow === true),
    columns: columns,
    keyFn: objType == 'stages' && stageAttemptId
  };
});

