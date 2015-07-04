
Template.table.events({
  'click th': function(e, t) {
    var sortKey = this.tableName + '-sort';
    var prevSort = Cookie.get(sortKey);
    if (prevSort && prevSort.id == this.id) {
      Cookie.set(sortKey, { id: prevSort.id, dir: -prevSort.dir });
    } else {
      Cookie.set(sortKey, { id: this.id, dir: this.defaultSort || 1 });
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
        var value = column.sortBy(data[i]);
        if (value || (value == 0)) return true;
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

makeTable = function(originalColumns, templateName, tableName, data, originalDefaultSort, dataKey, columnsKey, templatePrefix) {
  if (!originalDefaultSort) {
    if (!originalColumns.filter(function(c) { return c.id == 'id'; }).length) {
      throw new Error("Table " + tableName + " must specify a default sort value if 'id' column doesn't exist.");
    }
    originalDefaultSort = ['id', 1];
  }
  var defaultSort =
        (originalDefaultSort instanceof Array) ?
        { id: originalDefaultSort[0], dir: originalDefaultSort[1] } :
              originalDefaultSort;

  dataKey = dataKey || 'sorted';
  columnsKey = columnsKey || 'columns';
  templatePrefix = templatePrefix || (tableName + 'Row');

  var columnsObj = processColumns(originalColumns, tableName, templatePrefix);
  var colsById = columnsObj.colsById;
  var columns = columnsObj.columns;

  var helpers = {};
  helpers[dataKey] = function(arg) {
    var sort = Cookie.get(tableName + '-table-sort') || defaultSort;
    if (sort && (typeof sort !== 'object' || !('id' in sort))) {
      sort = defaultSort;
      console.error("Clearing bad cookie: %O, using default sort: %O", sort, defaultSort);
      Cookie.clear(tableName + '-table-sort');
    }
    //var sortObj = {};
    //sortObj[sort[0]] = sort[1];
    var sortColumn = colsById[sort.id];
    var cmpFn = sortColumn.cmpFn;
    var arr = null;
    if (typeof data == 'string') {
      arr = this[data];
    } else {
      arr = this;
    }

    arr = arr.sort(cmpFn);
    if (sort.dir == -1) {
      arr = arr.reverse();
    }

    return arr;
  };
  helpers[columnsKey] = columns;

  Template[templateName].helpers(helpers);
};

