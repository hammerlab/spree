

Template.table.events({
  'click th': function(e, t) {
    var sortKey = this.table + '-sort';
    var prevSort = Session.get(sortKey);
    if (prevSort && prevSort[0] == this.id) {
      Session.set(sortKey, [prevSort[0], -prevSort[1]]);
    } else {
      Session.set(sortKey, [this.id, -1]);
    }
  }
});

Template.table.helpers({
  validColumns: function(columns, data) {
    return columns.filter(function(column) {
      // Always show column headers when there is no data; table/page looks weird otherwise.
      if ((!data || !data.length) && (column.showInEmptyTable != false)) return true;
      for (var i = 0; i < data.length; i++) {
        if (column.sortBy(data[i])) return true;
      }
      return false;
    }.bind(this));
  }
});

Template.statsTable.helpers({
  join: function(data, column) {
    return {
      template: data.template,
      data: data[column.id]
    };
  }
});
