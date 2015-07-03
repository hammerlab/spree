
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

makeTable = function(originalColumns, templateName, tableName, data, defaultSort, dataKey, columnsKey, templatePrefix) {
  if (!defaultSort) {
    if (!originalColumns.filter(function(c) { return c.id == 'id'; }).length) {
      throw new Error("Table " + tableName + " must specify a default sort value if 'id' column doesn't exist.");
    }
    defaultSort = ['id', 1];
  }

  dataKey = dataKey || 'sorted';
  columnsKey = columnsKey || 'columns';
  templatePrefix = templatePrefix || (tableName + 'Row');

  var columnsObj = processColumns(originalColumns, tableName, templatePrefix);
  var colsById = columnsObj.colsById;
  var columns = columnsObj.columns;

  var helpers = {};
  helpers[dataKey] = function(arg) {
    var sort = Session.get(tableName + '-table-sort') || defaultSort;
    //var sortObj = {};
    //sortObj[sort[0]] = sort[1];
    var sortColumn = colsById[sort[0]];
    var cmpFn = sortColumn.cmpFn;
    var arr = null;
    if (typeof data == 'string') {
      arr = this[data];
    } else {
      arr = this;
    }

    arr = arr.sort(cmpFn);
    if (sort[1] == -1) {
      arr = arr.reverse();
    }

    return arr;
  };
  helpers[columnsKey] = columns;

  Template[templateName].helpers(helpers);
};

