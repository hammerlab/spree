
var columns = [
  { id: '0', label: 'Name', cmpFn: sortBy("0") },
  { id: '1', label: 'Name', cmpFn: sortBy("1") }
];

var columnsById = byId(columns, 'envRow', 'env');

Template['envRow-0'].helpers({
  first: function(data) { return data[0]; }
});

Template['envRow-1'].helpers({
  second: function(data) { return data[1]; }
});

Template.environmentPage.helpers({

  columns: function() { return columns; },

  sort: function(arr) {
    var sort = Session.get('env-table-sort') || ['0', 1];
    var cmpFn = columnsById[sort[0]].cmpFn;
    if (cmpFn) {
      return sort[1] == 1 ? arr.sort(cmpFn) : arr.sort(cmpFn).reverse();
    } else {
      return sort[1] == 1 ? arr.sort() : arr.sort().reverse();
    }
  }

});
