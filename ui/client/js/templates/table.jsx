
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
    var colsById = {};
    this.props.columns.forEach((col) => {
      colsById[col.id] = col;
    });
    return {
      colsById: colsById
    };
  },
  getMeteorData() {
    return {
      sort: Session.get(this.props.sortKey),
      rows: this.props.data
    }
  },
  render() {
    var displayCols = this.props.columns.filter((col) => {
      if (!this.data.rows || !this.data.rows.length) {
        return col.showInEmptyTable != false;
      }
      for (var i = 0; i < this.data.rows.length; ++i) {
        var row = this.data.rows[i];
        if (col.sortBy(row)) return true;
      }
      return false;
    });

    var sort = this.data.sort || this.props.defaultSort;
    var fn = this.state.colsById[sort.id].cmpFn;
    var rows = this.data.rows && this.data.rows.sort(fn) || [];
    if (sort.dir == -1) {
      rows = rows.reverse();
    }

    var columns = displayCols.map((column) => {
      return <TableHeader key={column.id} tableSortKey={this.props.sortKey} {...column} />;  //<th key={column.id} onClick={this.onHeaderClick}>{column.label}</th>
    });
    var header = <thead><tr key="header">{columns}</tr></thead>;

    var rowElems = rows.map((row, idx) => {
      var cols = displayCols.map((column, idx) => {
        return <td key={row.id + column.id}>{column.render ? column.render(column.sortBy(row)) : column.sortBy(row)}</td>
      });
      return <tr key={row.id + "-" + idx}>
        {cols}
      </tr>;
    });

    // {this.props.class}
    return <table className="table table-bordered table-striped table-condensed sortable">
      {header}
      <tbody>
      {rowElems}
      </tbody>
    </table>;
  }
});

RowTable = React.createClass({
  mixins: [ReactMeteorData],
  getInitialState() {
    var colsById = {};
    this.props.columns.forEach((col) => {
      colsById[col.id] = col;
    });
    return {
      colsById: colsById
    };
  },
  getMeteorData() {
    return {
      sort: Session.get(this.props.sortKey),
      rows: this.props.data
    }
  },
  render() {
    var displayCols = this.props.columns;

    var sort = this.data.sort || this.props.defaultSort;
    var fn = this.state.colsById[sort.id].cmpFn;
    var rows = this.data.rows && this.data.rows.sort(fn) || [];
    if (sort.dir == -1) {
      rows = rows.reverse();
    }

    var columns = displayCols.map((column) => {
      return <th key={column.id}>{column.label}</th>//<TableHeader key={column.id} tableSortKey={this.props.sortKey} {...column} />;
    });
    var header = <thead><tr key="header">{columns}</tr></thead>;

    var rowElems = rows.map((row, idx) => {
      var cols = displayCols.map((column, idx) => {
        return <td key={row.id + column.id}>{row.render ? row.render(column.sortBy(row)) : column.sortBy(row)}</td>
      });
      return <tr key={row.id + "-" + idx}>
        {cols}
      </tr>;
    });

    // {this.props.class}
    return <table className={"table table-bordered table-striped table-condensed sortable" + (this.props.class ? (' ' + this.props.class) : '')}>
      {header}
      <tbody>
      {rowElems}
      </tbody>
    </table>;  }
});

Template.reactTable.helpers({
  Table() {
    return Table;
  }
});

Template.reactRowTable.helpers({
  RowTable() {
    return RowTable;
  }
});
