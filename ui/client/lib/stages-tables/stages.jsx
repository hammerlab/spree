
function stageAttemptId(attempt) {
  return attempt && (attempt.stageId + '.' + attempt.id);
}

getStagesData = function() {
  var attempts = StageAttempts.find().fetch().map((a) => {
    a.fullId = stageAttemptId(a);
    return a;
  });

  var completed = attempts.filter(function(attempt) { return (attempt.ended || (attempt.time && attempt.time.end)) && !attempt.skipped && attempt.status == SUCCEEDED; });
  var active = attempts.filter(function(attempt) { return attempt.started && !attempt.ended; });
  var pending = attempts.filter(function(attempt) { return !attempt.started && !attempt.skipped; });
  var skipped = attempts.filter(function(attempt) { return attempt.skipped; });
  var failed = attempts.filter(function(attempt) { return attempt.ended && attempt.status == FAILED; });

  return {
    all: { stages: attempts, num: attempts.length },
    completed: { stages: completed, num: completed.length },
    active: { stages: active, num: active.length },
    pending: { stages: pending, num: pending.length },
    skipped: { stages: skipped, num: skipped.length },
    failed: { stages: failed, num: failed.length }
  };
};

function stageAttemptUrl(attempt) {
  return [ '', 'a', attempt.appId, 'stage', attempt.stageId ].join('/') + (attempt.id ? ('?attempt=' + attempt.id) : '');
}

var stageIDColumn = {
  label: 'Stage ID',
  id: 'id',
  sortBy: 'stageId',
  render: (attempt) => {
    return <a href={stageAttemptUrl(attempt)}>{
      attempt.stageId + (attempt.id ? (" (" + attempt.id + ")") : "")
    }</a>;
  },
  renderKey: ''
};
var stageNameColumn = {
  label: 'Description',
  id: 'desc',
  sortBy: 'name',
  render: (attempt) => { return <a href={stageAttemptUrl(attempt)}>{attempt.name}</a>; },
  renderKey: ''
};

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
      tasksColumn
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
    title: title + " (" + objs.num + ")",
    titleId: titleId,
    tableName: objType,
    objs: objs[objType],
    num: objs.num,
    show: objs.num || (alwaysShow === true),
    columns: columns,
    keyAttr: (objType == 'stages' ? 'fullId' : 'id')
  };
});

