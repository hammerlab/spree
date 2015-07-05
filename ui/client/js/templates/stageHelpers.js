
var columns = [
  { label: 'Stage ID', id: 'id', sortBy: 'stageId' },
  { label: 'Description', id: 'desc', sortBy: 'name' },
  startColumn,
  durationColumn,
  tasksColumn
].concat(ioBytesColumns);

Template.stagesTables.helpers({
  showAll: function() {
    return Cookie.get('stages-showAll') != false;
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
