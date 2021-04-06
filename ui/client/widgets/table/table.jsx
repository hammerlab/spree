
function emptyColumnCheck(col, rows, columnOracle) {
  if (!rows || !rows.length) {
    return col.showInEmptyTable != false;
  }
  if (!col.requireOracle) {
    return rows.find((row) => {
      for (var i = 0; i < col.sortBys.length; i++) {
        var val = col.sortBys[i](row);
        if (val || (val == 0 && col.truthyZero)) {
          return true;
        }
      }
    });
  }
  var val = null;
  if (typeof col.requireOracle === 'function') {
    val = col.requireOracle(columnOracle)
  } else if (typeof col.requireOracle === 'string') {
    val = acc(col.requireOracle)(columnOracle);
  } else {
    val = col.sortBys[0](columnOracle);
  }

  return val || (val == 0 && col.truthyZero)
}

function emptyRowCheck(row, cols) {
  for (var i = 1; i < cols.length; i++) {
    var val = cols[i].sortBys[0](row);
    if (val || (val == 0 && cols[i].truthyZero)) return true;
  }
  return false;
}

Table = React.createClass({
  mixins: [ReactMeteorData],
  getInitialState() {
    var colsById = {};
    this.props.columns.forEach((c) => {
      colsById[c.id] = c;
    });
    return {
      colsById: colsById,
      tableSortKey: this.props.name + '-table-sort',
      tableHiddenKey: this.props.name + '-table-hidden',
      tableColumnsKey: this.props.name + '-table-columns',
      tableOptsKey: this.props.name + '-table-opts',
      showSettings: false,
      showSettingsGear: false
    };
  },
  maybeSortData(data) {
    if (this.props.clientSort) {
      var sort = Cookie.get(this.state.tableSortKey) || this.props.defaultSort;
      var sortId = sort && sort.id || this.props.sortId || this.props.columns[0].id || 'id';
      var sortDir = sort && sort.dir || this.props.sortDir || 1;
      var fn = this.state.colsById[sortId].cmpFn;
      var rows = data.sort(fn);
      if (sortDir == -1) {
        rows = rows.reverse();
      }
    }
    return data;
  },
  getMeteorData() {
    var opts = Cookie.get(this.state.tableOptsKey) || {};
    if (opts.limit === undefined) {
      opts.limit = 100;
    }

    var sort = opts.sort;
    if (!sort) {
      sort = opts.sort = {};
      if (this.props.sortId) {
        var sortCol = this.state.colsById[this.props.sortId];
        sort = {};
        sortCol.sortKeys.forEach((k) => {
          sort[k] = this.props.sortDir || sortCol.defaultSort || 1;
        });
      }
      // Add the first column of the table as a (possibly secondary) sort key, if it's not already
      // present in the sort object.
      var firstId = this.props.columns[0].id;
      if(!(firstId in sort)) {
        sort[firstId] = 1;
      }
    }

    var handle = this.props.subscriptionFn && this.props.subscriptionFn(opts);

    var rows =
          this.maybeSortData(this.props.data) ||
          ((typeof this.props.collection === 'string') ?
                window[this.props.collection] :
                this.props.collection
          ).find(this.props.selector || {}, { sort: sort }).fetch();

    if (this.props.selectRows) {
      rows.forEach((row) => {
        if (!row.id) {
          if (!row._id) {
            console.error("Row lacking 'id' and '_id':", row);
          } else {
            row.id = row._id.toHexString();
          }
        }
        if (!row.label) {
          if (row.id in this.props.rowData) {
            row.label = this.props.rowData[row.id].label;
          } else {
            console.error("No rowData entry found for %s", row.id, this.props.rowData);
          }
        }
      });
    }
    return {
      sort: Cookie.get(this.state.tableSortKey),
      hidden: Cookie.get(this.state.tableHiddenKey),
      columnSettings: Cookie.get(this.state.tableColumnsKey) || {},
      rows: rows,
      opts: opts,
      handle: handle
    }
  },
  toggleCollapsed() {
    Cookie.set(this.state.tableHiddenKey, !Cookie.get(this.state.tableHiddenKey));
  },
  render() {
    var columnCookieMap = this.data.columnSettings;
    var ready = this.data.handle && this.data.handle.ready();

    var nonEmptyMap = {};
    var canDisplayMap = {};
    var displayedMap = {};
    var columnIDs = {};
    var displayCols =
          this.props.columns.filter((col) => {
            if (col.id in columnIDs) {
              throw new Error("Duplicate column ID: ", col.id, col);
            }
            columnIDs[col.id] = true;

            var cookie = (col.id in columnCookieMap) ? columnCookieMap[col.id] : null;
            var canDisplay = cookie || ((cookie != false) && (col.showByDefault != false));
            var hasData = this.props.allowEmptyColumns || emptyColumnCheck(col, this.data.rows, this.props.columnOracle);
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

    var columnHeaders = displayCols.map((column) => {
      return this.props.disableSort ?
            <th key={column.id}>{column.label}</th> :
            <TableHeader
                  key={column.id}
                  tableSortKey={this.state.tableSortKey}
                  tableOptsKey={this.state.tableOptsKey}
                  clientSort={this.props.clientSort}
                  {...column} />;
    });

    var displayRows =
          this.data.rows.filter((row) => {
            var id = row.id;
            var cookie = (id in columnCookieMap) ? columnCookieMap[id] : null;
            var canDisplay = (cookie != false) && (row.showByDefault != false);
            var hasData = !this.props.hideEmptyRows || emptyRowCheck(row, displayCols);
            var displayed = canDisplay && hasData;
            if (this.props.selectRows) {
              if (hasData) {
                nonEmptyMap[id] = true;
              }
              if (canDisplay) {
                canDisplayMap[id] = true;
              }
              if (displayed) {
                displayedMap[id] = true;
              }
            }
            return displayed;
          });

    var numRows = displayRows.length;

    var rowElems = displayRows.map((row) => {
      var cols = displayCols.map((column) => {
        var render =
              column.render ||
              (this.props.rowData && row.id in this.props.rowData && this.props.rowData[row.id].render) ||
              defaultRenderer;
        var renderValueFn = column.renderValueFn || column.sortBys[0];
        return <td key={column.id}>{render ? render(renderValueFn(row), this.props.columnOracle) : renderValueFn(row)}</td>
      });
      var keyFn = this.props.keyFn;
      if (typeof keyFn === 'string') {
        keyFn = acc(keyFn);
      }
      var key = keyFn ? keyFn(row) : row.id;
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

    var title =
          <TableTitle
                settings={this.props.selectRows ? this.data.rows : this.props.columns}
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
                ready={ready}
                numRows={numRows}
                {...this.props}/>;

    var table = this.data.hidden ? null :
          <TableElem
                ready={ready}
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
    // (only relevant to sibling TableTitle), or there is a subscription updating.
    return nextProps.showSettingsGear == this.props.showSettingsGear && (nextProps.ready != false);
  },
  render() {
    return <table id={this.props.name} className={this.props.className}>
      <thead>
      <tr>{this.props.columnHeaders}</tr>
      </thead>
      <tbody>{this.props.rowElems}</tbody>
    </table>;
  }
});

Template.registerHelper("Table", function() { return Table; });
