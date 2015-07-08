
function emptyColumnCheck(col, rows) {
  if (!rows || !rows.length) {
    return col.showInEmptyTable != false;
  }
  for (var i = 0; i < rows.length; ++i) {
    var row = rows[i];
    if (col.sortBy(row)) return true;
  }
  return false;
}

function emptyRowCheck(row, cols) {
  for (var i = 1; i < cols.length; i++) {
    if (cols[i].sortBy(row)) {
      return true;
    }
  }
  return false;
}

Table = React.createClass({
  mixins: [ReactMeteorData],
  getInitialState() {
    return jQuery.extend(
          processColumns(this.props.columns),
          {
            tableSortKey: this.props.name + '-table-sort',
            tableHiddenKey: this.props.name + '-table-hidden',
            tableColumnsKey: this.props.name + '-table-columns',
            tableOptsKey: this.props.name + '-table-opts',
            showSettings: false,
            showSettingsGear: false
          }
    );
  },
  getMeteorData() {
    return {
      sort: Cookie.get(this.state.tableSortKey),
      hidden: Cookie.get(this.state.tableHiddenKey),
      rows: this.props.data ? (this.props.data.sort ? this.props.data : this.props.data.fetch()) : [],
      columnSettings: Cookie.get(this.state.tableColumnsKey) || {},
      opts: Cookie.get(this.state.tableOptsKey)
    }
  },
  toggleCollapsed() {
    Cookie.set(this.state.tableHiddenKey, !Cookie.get(this.state.tableHiddenKey));
  },
  render() {
    var columnCookieMap = this.data.columnSettings;

    var nonEmptyMap = {};
    var canDisplayMap = {};
    var displayedMap = {};
    var columnIDs = {};
    var displayCols =
          this.state.columns.filter((col) => {
            if (col.id in columnIDs) {
              throw new Error("Duplicate column ID: ", col.id, col);
            }
            columnIDs[col.id] = true;
            var cookie = (col.id in columnCookieMap) ? columnCookieMap[col.id] : null;
            var canDisplay = cookie || ((cookie != false) && (col.showByDefault != false));
            var hasData = this.props.allowEmptyColumns || emptyColumnCheck(col, this.data.rows);
            var displayed = canDisplay && hasData;
            if (!this.props.selectRows) {
              if (hasData) {
                nonEmptyMap[col.id] = true;
              }
              if (canDisplay) {
                canDisplayMap[col.id] = true;
              }
              if (displayed) {
                displayedMap[col.id] = true;
              }
            }
            return displayed;
          });

    var sort = this.data.sort || this.props.defaultSort;
    var sortId = sort && sort.id || this.props.sortId || displayCols[0].id || 'id';
    var sortDir = sort && sort.dir || this.props.sortDir || 1;
    var fn = this.state.colsById[sortId].cmpFn;
    var rows = this.data.rows.sort(fn);
    if (sortDir == -1) {
      rows = rows.reverse();
    }

    var columnHeaders = displayCols.map((column) => {
      return this.props.disableSort ?
            <th key={column.id}>{column.label}</th> :
            <TableHeader
                  key={column.id}
                  tableSortKey={this.state.tableSortKey}
                  {...column} />;
    });

    var displayRows =
          rows.filter((row) => {
            var cookie = (row.id in columnCookieMap) ? columnCookieMap[row.id] : null;
            var canDisplay = (cookie != false) && (row.showByDefault != false);
            var hasData = !this.props.hideEmptyRows || emptyRowCheck(row, displayCols);
            var displayed = canDisplay && hasData;
            if (this.props.selectRows) {
              if (hasData) {
                nonEmptyMap[row.id] = true;
              }
              if (canDisplay) {
                canDisplayMap[row.id] = true;
              }
              if (displayed) {
                displayedMap[row.id] = true;
              }
            }
            return displayed;
          });

    var rowElems = displayRows.map((row) => {
      var cols = displayCols.map((column) => {
        var render = column.render || row.render;
        var renderValueFn = column.renderValueFn || column.sortBy;
        return <td key={column.id}>{render ? render(renderValueFn(row)) : renderValueFn(row)}</td>
      });
      var key = this.props.keyAttr ? row[this.props.keyAttr] : (row.id || row._id);
      return <tr key={key}>{cols}</tr>;
    });

    var className = [
      'table',
      'table-bordered',
      'table-striped',
      'table-condensed',
      'sortable'
    ]
          .concat(this.props.class ? [this.props.class] : [])
          .concat(this.data.hidden ? ['hidden'] : [])
          .join(' ');

    var title = <TableTitle
          settings={this.props.selectRows ? rows : this.props.columns}
          showSettingsFn={this.showSettings}
          displayedMap={displayedMap}
          nonEmptyMap={nonEmptyMap}
          canDisplayMap={canDisplayMap}
          tableColumnsKey={this.state.tableColumnsKey}
          tableName={this.props.name}
          visible={this.state.showSettings}
          showSettingsGear={this.state.showSettingsGear}
          tableHidden={this.data.hidden}
          toggleCollapsed={this.toggleCollapsed}
          opts={this.data.opts}
          optsKey={this.state.tableOptsKey}
          {...this.props}/>;

    var table = this.data.hidden ? null :
          <TableElem
                showSettingsGear={this.state.showSettingsGear}
                className={className}
                columnHeaders={columnHeaders}
                rowElems={rowElems} />;

    return <div
          className="table-container"
          onMouseEnter={(e) => { this.setState({showSettingsGear: true}); } }
          onMouseLeave={(e) => { this.setState({showSettingsGear: false}); } }>
      {title}
      {table}
    </div>;
  },
  showSettings: function(b) {
    this.setState({ showSettings: b });
  }
});

TableElem = React.createClass({
  shouldComponentUpdate(nextProps, nextState) {
    // skip re-rendering if the settings gear is the only thing that changed in the Table
    // (only relevant to sibling TableTitle)
    return nextProps.showSettingsGear == this.props.showSettingsGear;
  },
  render() {
    return <table className={this.props.className}>
      <thead>
      <tr>{this.props.columnHeaders}</tr>
      </thead>
      <tbody>{this.props.rowElems}</tbody>
    </table>;
  }
});

Template.registerHelper("Table", function() { return Table; });
