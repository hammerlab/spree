
var columns = [
  { id: '0', label: 'Name', sortBy: "0" },
  { id: '1', label: 'Value', sortBy: "1" }
];

Template.environmentPage.helpers({
  columns: function() { return columns; }
});
