
Template.environmentTable.helpers({
  first: function(data) { return data[0]; },
  second: function(data) { return data[1]; },
  props: function(arr) {
    if (!arr) return null;
    return arr.sort(function(a,b) {
      if (a[0] > b[0]) return 1;
      if (a[0] < b[0]) return -1;
      return 0;
    });
  }
});
