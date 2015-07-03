
Template.table.events({
  'click th': function(e, t) {
    var sortKey = this.tableName + '-sort';
    var prevSort = Session.get(sortKey);
    if (prevSort && prevSort[0] == this.id) {
      Session.set(sortKey, [prevSort[0], -prevSort[1]]);
    } else {
      Session.set(sortKey, [this.id, this.defaultSort || 1]);
    }
  }
});

Template.table.helpers({
  validColumns: function(columns, data) {
    return columns.filter(function(column) {
      // Always (with a few exceptions) show column headers when there is no data; table/page looks weird otherwise.
      if (!data || !data.length) {
        return column.showInEmptyTable != false;
      }
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

