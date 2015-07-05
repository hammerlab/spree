
TableHeader = React.createClass({
  onClick(e) {
    var extantSort = Cookie.get(this.props.tableSortKey);
    var newSort =
          (extantSort && extantSort.id == this.props.id) ?
          { id: this.props.id, dir: -extantSort.dir } :
          { id: this.props.id, dir: this.props.defaultSort || 1 };

    Cookie.set(this.props.tableSortKey, newSort);
  },
  render() {
    var extantSort = Cookie.get(this.props.tableSortKey);
    var isCurrentSort = extantSort && extantSort.id == this.props.id;
    return <th onClick={this.onClick}>{this.props.label + (isCurrentSort ? (extantSort.dir == 1 ? ' ▴' : ' ▾') : '')}</th>
  }
});


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
            showSettings: false
          }
    );
  },
  getMeteorData() {
    return {
      sort: Cookie.get(this.state.tableSortKey),
      hidden: Cookie.get(this.state.tableHiddenKey),
      rows: this.props.data
      ,columnSettings: Cookie.get(this.state.tableColumnsKey) || {}
    }
  },
  render() {

    var columnCookieMap = this.data.columnSettings;

    var nonEmptyMap = {};
    var canDisplayMap = {};
    var displayedMap = {};
    var displayCols =
          this.state.columns.filter((col) => {
            var cookie = (col.id in columnCookieMap) ? columnCookieMap[col.id] : null;
            var canDisplay = (cookie != false) && (col.showByDefault != false);
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
    var fn = this.state.colsById[sort.id].cmpFn;
    var rows = this.data.rows && this.data.rows.sort(fn) || [];
    if (sort.dir == -1) {
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
            var hasData = this.props.allowEmptyRows || emptyRowCheck(row, displayCols);
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

    var rowElems = displayRows.map((row, idx) => {
      var cols = displayCols.map((column, idx) => {
        var render = column.render || row.render;
        return <td key={row.id + column.id}>{render ? render(column.sortBy(row)) : column.sortBy(row)}</td>
      });
      return <tr key={row.id + "-" + idx}>
        {cols}
      </tr>;
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

    var mouseHandlers = {
      onMouseOver: this.onMouseOver,
      onMouseOut: this.onMouseOut
    };

    return <div className="table-container">
      <h4 className="table-title">
        <span className="title">{this.props.title}</span>
        <TableSettings
              settings={this.props.selectRows ? rows : this.props.columns}
              mouseHandlers={mouseHandlers}
              displayedMap={displayedMap}
              nonEmptyMap={nonEmptyMap}
              canDisplayMap={canDisplayMap}
              tableColumnsKey={this.state.tableColumnsKey}
              tableName={this.props.name}
              visible={this.state.showSettings} />
      </h4>
      {
        this.props.rightTitle ?
              <span className="right-title">{this.props.rightTitle}</span> :
              null
      }
      <table className={className}>
        <thead><tr>{columnHeaders}</tr></thead>
        <tbody>{rowElems}</tbody>
      </table>
    </div>;
  },
  onMouseOver(e) {
    this.setState({ showSettings: true });
  },
  onMouseOut(e) {
    this.setState({ showSettings: false });
  }
});

TableSettings = React.createClass({
  getMeteorData() {
    return {
      columnCookieMap: Cookie.get(this.props.tableColumnsKey)
    };
  },
  render() {
    return <div className="settings-container" {...this.props.mouseHandlers}>
      <img
            className='gear'
            src='/img/gear.png'
            width="20"
            height="20"
             />
      <div className="settings-tooltip-container">
        <div className={'settings-tooltip' + (this.props.visible ? '' : ' hidden')}>
          {
            this.props.settings.map((c) => {
              return <TableSettingsTooltipRow
                    key={c.id}
                    column={c}
                    displayed={(c.id in this.props.displayedMap)}
                    nonEmpty={(c.id in this.props.nonEmptyMap)}
                    canDisplay={(c.id in this.props.canDisplayMap)}
                    tableColumnsKey={this.props.tableColumnsKey}
                    />;
            })
          }
        </div>
      </div>
    </div>
  }
});

TableSettingsTooltipRow = React.createClass({
  getCheckbox() {
    return $(this.getDOMNode()).find('input.tooltip-checkbox');
  },
  setCookie(b) {
    var columnCookieMap = Cookie.get(this.props.tableColumnsKey) || {};
    columnCookieMap[this.props.column.id] = b;
    Cookie.set(this.props.tableColumnsKey, columnCookieMap);
  },
  onClick(e) {
    var checkbox = this.getCheckbox();
    var newValue = !checkbox.prop('checked');
    this.setCookie(newValue);
    e.stopPropagation();
  },
  onCheckboxClick(e) {
    e.stopPropagation();
  },
  onCheckboxChange(e) {
    var checkbox = this.getCheckbox();
    var newValue = checkbox.prop('checked');
    this.setCookie(newValue);
  },
  render() {
    return <div key={this.props.column.id} className="tooltip-row" onClick={this.onClick}>
      <input
            className="tooltip-checkbox"
            type="checkbox"
            onChange={this.onCheckboxChange}
            checked={this.props.canDisplay}
            onClick={this.onCheckboxClick} />
      <span className={"tooltip-label" + (this.props.nonEmpty ? '' : ' empty')}>{this.props.column.label}</span>
    </div>;
  }
});
