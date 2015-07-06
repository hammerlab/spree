
processColumns = function(originalColumns) {
  var colsById = {};
  var columns = originalColumns.map(function(originalColumn) {
    var column = jQuery.extend({}, originalColumn);
    if (!column.sortBy) {
      throw new Error("Column " + column.id + " requires a 'sortBy' attribute");
    }
    if (typeof column.sortBy == 'string') {
      column.sortKey = column.sortBy;
      column.sortBy = acc(column.sortBy);
    }
    if (column.renderKey !== undefined) {
      column.renderValueFn = acc(column.renderKey);
    }
    column.cmpFn = function(a, b) {
      var fna = column.sortBy(a);
      var fnb = column.sortBy(b);
      if (fna < fnb || fna === undefined) return -1;
      if (fna > fnb || fnb === undefined) return 1;
      return 0;
    };

    colsById[column.id] = column;

    return column;
  });

  return {
    columns: columns,
    colsById: colsById
  };
};

