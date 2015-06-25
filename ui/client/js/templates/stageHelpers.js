
var columns = [
  { label: 'Stage ID', id: 'id', sortBy: 'stageId' },
  { label: 'Description', id: 'desc', sortBy: 'name' },
  startColumn,
  durationColumn,
  tasksColumn
].concat(ioBytesColumns);

makeTable(
  columns, 'stagesTables', 'sorted', 'columns', 'stageRow', 'stage', function() { return this; }, ['id', -1]
);

Template.stagesTables.helpers({
  showAll: function() {
    return Session.get('stages-showAll') != false;
  }
});

function unsetShowAll() {
  Session.set("stages-showAll", false);
}

function setShowAll() {
  Session.set("stages-showAll", true);
}

Template.stagesTables.events({
  'click #active-link, click #completed-link, click #failed-link, click #pending-link, click #skipped-link': unsetShowAll,
  'click #all-link': setShowAll
});
