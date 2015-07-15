
function emptyColumnCheck(col, rows) {
  if (!rows || !rows.length) {
    return col.showInEmptyTable != false;
  }
  for (var i = 0; i < rows.length; ++i) {
    var row = rows[i];
    var val = col.sortBys[0](row);
    if (val || (val == 0 && col.truthyZero)) return true;
  }
  return false;
}

function emptyRowCheck(row, cols) {
  for (var i = 1; i < cols.length; i++) {
    var val = cols[i].sortBys[0](row);
    if (val || (val == 0 && cols[i].truthyZero)) return true;
  }
  return false;
}

renderers = {
  bytes: formatBytes,
  time: formatTime
};
defaultRenderer = (x) => { if (!x) return '-'; return x; };

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
    if (opts.sort === undefined) {
      opts.sort = { id: 1 };
    }

    var handle = this.props.subscriptionFn && this.props.subscriptionFn(opts);

    var sort = opts.sort;
    if (!sort) {
      if (this.props.sortId) {
        var sortCol = this.state.colsById[this.props.sortId];
        sort = {};
        sortCol.sortKeys.forEach((k) => {
          sort[k] = sortCol.defaultSort || 1;
        });
      }
    }

    var obj = {};
    if (sort) {
      obj.sort = sort;
    }
    var rows =
          this.maybeSortData(this.props.data) ||
          ((typeof this.props.collection === 'string') ?
                window[this.props.collection] :
                this.props.collection
          ).find(this.props.selector || {}, obj).fetch();

    if (this.props.selectRows) {
      rows.forEach((row) => {
        if (!row.id) {
          if (!row._id) {
            console.error("Row lacking 'id' and '_id':", row);
          } else {
            row.id = row._id.toHexString();
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

    var rowElems = displayRows.map((row, idx) => {
      var cols = displayCols.map((column) => {
        var render =
              column.render ||
              (typeof row.render === 'string' ?
                    (row.render in renderers ?
                          renderers[row.render] :
                          defaultRenderer
                    ) :
                    row.render
              );
        var renderValueFn = column.renderValueFn || column.sortBys[0];
        return <td key={column.id}>{render ? render(renderValueFn(row)) : renderValueFn(row)}</td>
      });
      var key = row.id;
      if (key === undefined) {
         key = this.props.keyFn ? this.props.keyFn(row) : idx;
      }
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
    return <table className={this.props.className}>
      <thead>
      <tr>{this.props.columnHeaders}</tr>
      </thead>
      <tbody>{this.props.rowElems}</tbody>
    </table>;
  }
});

Template.registerHelper("Table", function() { return Table; });
