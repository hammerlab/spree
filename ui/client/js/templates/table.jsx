
TableHeader = React.createClass({
  onClick(e) {
    var extantSort = Session.get(this.props.tableSortKey);
    var newSort =
          (extantSort && extantSort.id == this.props.id) ?
          { id: this.props.id, dir: -extantSort.dir } :
          { id: this.props.id, dir: this.props.defaultSort || 1 };

    Session.set(this.props.tableSortKey, newSort);
  },
  render() {
    var extantSort = Session.get(this.props.tableSortKey);
    var isCurrentSort = extantSort && extantSort.id == this.props.id;
    return <th onClick={this.onClick}>{this.props.label + (isCurrentSort ? (extantSort.dir == 1 ? ' ▴' : ' ▾') : '')}</th>
  }
});

Table = React.createClass({
  mixins: [ReactMeteorData],
  getInitialState() {
    return jQuery.extend(
          processColumns(this.props.columns),
          { tableSortKey: this.props.name + '-table-sort' }
    );
  },
  getMeteorData() {
    return {
      sort: Session.get(this.state.tableSortKey),
      rows: this.props.data
    }
  },
  render() {
    var displayCols = !this.props.allowEmptyCols ?
          this.state.columns.filter((col) => {
            if (!this.data.rows || !this.data.rows.length) {
              return col.showInEmptyTable != false;
            }
            for (var i = 0; i < this.data.rows.length; ++i) {
              var row = this.data.rows[i];
              if (col.sortBy(row)) return true;
            }
            return false;
          }) :
          this.state.columns;

    var sort = this.data.sort || this.props.defaultSort;
    var fn = this.state.colsById[sort.id].cmpFn;
    var rows = this.data.rows && this.data.rows.sort(fn) || [];
    if (sort.dir == -1) {
      rows = rows.reverse();
    }

    var columns = displayCols.map((column) => {
      return this.props.disableSort ?
            <th key={column.id}>{column.label}</th> :
            <TableHeader key={column.id} tableSortKey={this.state.tableSortKey} {...column} />;
    });

    var displayRows =
          this.props.hideEmptyRows ?
                rows.filter((row) => {
                  for (var i = 0; i < displayCols.length; i++) {
                    var c = displayCols[i];
                    if (c.render(c.sortBy(row))) {
                      return true;
                    }
                  }
                  return false;
                }) :
                rows;

    var rowElems = displayRows.map((row, idx) => {
      var cols = displayCols.map((column, idx) => {
        var render = column.render || row.render;
        return <td key={row.id + column.id}>{render ? render(column.sortBy(row)) : column.sortBy(row)}</td>
      });
      return <tr key={row.id + "-" + idx}>
        {cols}
      </tr>;
    });

    var className =
          "table table-bordered table-striped table-condensed sortable" + (this.props.class ? (" " + this.props.class) : "");
    return <table className={className}>
      <thead><tr>{columns}</tr></thead>
      <tbody>{rowElems}</tbody>
    </table>;
  }
});

RowTable = React.createClass({
  mixins: [ReactMeteorData],
  getInitialState() {
    return processColumns(this.props.columns);
  },
  getMeteorData() {
    return {
      sort: Session.get(this.props.sortKey),
      rows: this.props.data
    }
  },
  render() {
    var displayCols = this.state.columns;

    var sort = this.data.sort || this.props.defaultSort;
    var fn = this.state.colsById[sort.id].cmpFn;
    var rows = this.data.rows && this.data.rows.sort(fn) || [];
    if (sort.dir == -1) {
      rows = rows.reverse();
    }

    var columns = displayCols.map((column) => {
      return <th key={column.id}>{column.label}</th>
    });

    var rowElems = rows.map((row, idx) => {
      var cols = displayCols.map((column) => {
        return <td key={row.id + column.id}>{row.render ? row.render(column.sortBy(row)) : column.sortBy(row)}</td>
      });
      return <tr key={row.id + "-" + idx}>
        {cols}
      </tr>;
    });

    var className =
          "table table-bordered table-striped table-condensed sortable" + (this.props.class ? (' ' + this.props.class) : '');
    return <table className={className}>
      <thead><tr>{columns}</tr></thead>
      <tbody>{rowElems}</tbody>
    </table>;  }
});
