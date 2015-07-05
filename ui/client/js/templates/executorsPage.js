
var columns = [
  { id: 'id', label: 'ID', sortBy: 'id' },
      hostColumn,
      portColumn,
      numBlocksColumn,
      maxMemColumn
]
      .concat(spaceColumns)
      .concat(taskColumns)
      .concat([ taskTimeColumn ])
      .concat(ioBytesColumns);

Template.executorsPage.helpers({
  columns: function() { return columns; },
  title: function() {
    return "Executors (" + Executors.find().count() + ")";
  }
});
